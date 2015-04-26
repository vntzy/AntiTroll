// ==UserScript==
// @name ChristmasTree
// @include http://*
// @include https://*
// @include about:blank
// @require dependencies/jquery-2.1.3.min.js
// @require core/utils.js
// ==/UserScript==

var $ = window.$.noConflict(true); // Required for IE

var _reportFalsePositive = function(domElement) {
    kango.invokeAsync("globalClassifier.markFalsePositive",
        _renderTextFromDomElement(domElement),
        function(result) {});
};

var _reportFalseNegative = function(domElement) {
    kango.invokeAsync("globalClassifier.markContentAsUnacceptable",
        _renderTextFromDomElement(domElement),
        function(result) {});
};

//TODO: Remove false positive events from ContentMarker

var _domEventHandler = function(mutations) {
    var targetDomElements = [];
    for(var i = 0; i < mutations.length; i++) {
        var mutationRecord = mutations[i];
        switch(mutationRecord.type) {
            //TODO: Optimize
            case "bodyInit":
                _append(targetDomElements, mutationRecord.target);
                break;
            case "characterData":
            case "childList":
                _append(targetDomElements, mutationRecord.target);
                break;
            default:
                break;
        }
    }
    var contentElements =
        contentFilter.findAllContentOnDOMElements(targetDomElements, window);
    for (var i = 0; i < contentElements.length; i++) {
        var domElement = contentElements[i];
        var plaintextValue = _renderTextFromDomElement(domElement);
        kango.invokeAsync("globalClassifier.isContentAcceptable",
            plaintextValue, 
                function(currentDomElement, currentPlaintextValue) {
                    return function(isNotToxic) {
                        kango.console.log(
                            currentPlaintextValue + "|" + isNotToxic);
                        contentMarker.mark(currentDomElement, !isNotToxic);
                    }
            }(_shallowestCopy(domElement), _shallowestCopy(plaintextValue)));
    }
};

var observer = new MutationObserver(_domEventHandler);

// MutationObserverInit configuration:
var observerInit = {
    attributes: false, childList: true, characterData: true, subtree: true
};

var contentMarker =
    new ContentMarker(_reportFalsePositive, _reportFalseNegative);

$(document).ready(function() {
    _domEventHandler(
        [{
            type: "bodyInit",
            target: document.body
        }]
    );
});

observer.observe(document.body, observerInit);
