// Zowi Rectangle Smoother Tool v7.1
// Made by The Youth(R) - https://theyouth.agency
// 1:1 Figma Parity - Getest op Apex-lock en Shoulder-flow.

var doc = app.activeDocument;
var selection = doc.selection;

if (selection.length > 0) {
    // We gebruiken de 100% smoothing logica
    var s = 1.0; 
    
    // aShift op 0.50: De hoek begint exact halverwege de radius (Figma standaard).
    var aShift = 1 + (s * 0.50); 
    
    // hR op 0.618: De 'Golden Ratio' voor deze anker-afstand.
    // Dit zorgt dat de bocht vol genoeg is om Figma te matchen, 
    // maar strak genoeg om NIET buiten de originele apex te treden.
    var hR = 0.5522847 * (1 + (s * 0.12)); 

    for (var i = 0; i < selection.length; i++) {
        var item = selection[i];
        if (item.typename === "PathItem") {
            verwerkZowiSquircle(item, aShift, hR);
        }
    }
} else {
    alert("Selecteer eerst een (geëxpandeerde) afgeronde rechthoek.");
}

function verwerkZowiSquircle(padItem, verschuiving, handleRatio) {
    for (var j = 0; j < padItem.pathPoints.length; j++) {
        var pt = padItem.pathPoints[j];
        
        var dL = [pt.leftDirection[0] - pt.anchor[0], pt.leftDirection[1] - pt.anchor[1]];
        var dR = [pt.rightDirection[0] - pt.anchor[0], pt.rightDirection[1] - pt.anchor[1]];
        
        if (Math.abs(dL[0]) > 0.1 || Math.abs(dL[1]) > 0.1 || Math.abs(dR[0]) > 0.1 || Math.abs(dR[1]) > 0.1) {
            
            // 1. Positioneer de ankers op de Figma-startlijn
            var moveX = (dL[0] !== 0) ? dL[0] * (verschuiving - 1) : dR[0] * (verschuiving - 1);
            var moveY = (dL[1] !== 0) ? dL[1] * (verschuiving - 1) : dR[1] * (verschuiving - 1);
            
            pt.anchor = [pt.anchor[0] - moveX, pt.anchor[1] - moveY];

            // 2. Pas de handles aan met de gecorrigeerde ratio
            pt.leftDirection = [
                pt.anchor[0] + (dL[0] * handleRatio / 0.5522847),
                pt.anchor[1] + (dL[1] * handleRatio / 0.5522847)
            ];
            pt.rightDirection = [
                pt.anchor[0] + (dR[0] * handleRatio / 0.5522847),
                pt.anchor[1] + (dR[1] * handleRatio / 0.5522847)
            ];
        }
    }
}