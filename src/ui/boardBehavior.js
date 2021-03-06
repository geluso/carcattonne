/* Behaviors dictate how a board should respond to user interaction
* This default behavior does nothing 
*/
class BoardBehavior {
    start(boardRenderer) {} // set the behavior as active behavior on the BoardRenderer
    click(boardRenderer, renderer) { }
    enter(boardRenderer, renderer) { }
    leave(boardRenderer, renderer) { }
    stop(boardRenderer) {} // unset the behavior
}
/** Don't respond to any user input at all */
class NoBehavior extends BoardBehavior { }
/* Sets a hex to target clicked hexagon location */
class SetHex extends BoardBehavior {
    constructor() {
        super();
        // the hextype to use for the setted hex
        this.hexType = proto.carcattonne_data.HexType.FOREST; 
    }
    click(boardRenderer, renderer) {
        var hex = renderer.hex;
        if (hex === undefined) {
            return;
        }
        // create and set the new hex to the board
        var newHex = Hex.fromType(this.hexType)
        newHex.coord = hex.coord;
        boardRenderer.board.hexes.set(hex.coord, newHex);
        
        // update the hex renderer
        var hexRenderer = boardRenderer.hexRenderers.get(hex.coord);
        hexRenderer.hex = newHex;
        hexRenderer.render(boardRenderer.vgGrid);
    }
}
class SetChit extends BoardBehavior {
    constructor() {
        super();
        this.composite = new EmphasizeHoveredObject(r => r.chit !== undefined || r.hex !== undefined);
        this.chitType = proto.carcattonne_data.ChitType.HEXFROMBAG;
    }
    click(boardRenderer, renderer) {
        if (renderer instanceof ChitRenderer) {
            renderer.setChit(new Chit(this.chitType));
        }
        if (renderer instanceof HexRenderer) {
            renderer.chitRenderer.setChit(new Chit(this.chitType));
        }
    }
    start(boardRenderer) {
        this.composite.start(boardRenderer);
    }
    enter(boardRenderer, renderer) {
        this.composite.enter(boardRenderer, renderer);
    }
    leave(boardRenderer, renderer) {
        this.composite.leave(boardRenderer, renderer);
    }
    stop(boardRenderer) {
        this.composite.stop(boardRenderer);
    }
}
/** Shows all the nodes of all the hexes of the board */
class ShowAllNodes extends BoardBehavior {
    start(boardRenderer) {
        var nodes = boardRenderer.board.getAllNodes();
        boardRenderer.showNodes(nodes);
    }
    stop(boardRenderer) {
        boardRenderer.hideAllNodes();
    }
}
/** Shows all nodes of clicked hex */
class ShowNodesOfClickedHex extends BoardBehavior {
    constructor() {
        super();
    }
    start(boardRenderer) {
        boardRenderer.hideAllNodes();
    }
    click(boardRenderer, renderer) {
        if (renderer.hex === undefined) {
            return;
        }
        var nodes = renderer.hex.coord.nodes;
        boardRenderer.showNodes(nodes);
    }
    stop(boardRenderer) {
        boardRenderer.hideAllNodes();
    }
}

class ShowAllEdges extends BoardBehavior {
    start(boardRenderer) {
        var allEdges = boardRenderer.board.getAllEdges();
        boardRenderer.showEdges(allEdges);
    }
    stop(boardRenderer) {
        boardRenderer.hideAllEdges();
    }
}
class ShowEdgesOfClickedHex extends BoardBehavior {
    start(boardRenderer) {
        boardRenderer.hideAllEdges();
    }
    click(boardRenderer, renderer) {
        var edges = renderer.hex.coord.edges;
        boardRenderer.showEdges(edges);
    }
    stop(boardRenderer) {
        boardRenderer.hideAllEdges();
    }
}
class ShowEdgesOfClickedNode extends BoardBehavior {
    constructor() {
        super();
        let isNodeRenderer = r => r.node !== undefined;
        this.composite = new CompositeBehavior(
            new ShowAllNodes(), 
            new EmphasizeHoveredObject(isNodeRenderer));
    }
    start(boardRenderer) {
        this.composite.start(boardRenderer);
    }
    enter(boardRenderer, renderer) {
        this.composite.enter(boardRenderer, renderer);
    }
    leave(boardRenderer, renderer) {
        this.composite.leave(boardRenderer, renderer);
    }
    click(boardRenderer, renderer) {
        if (renderer.node === undefined) {
            return;
        }
        var edges = renderer.node.edges;
        boardRenderer.showEdges(edges);
    }
    stop(boardRenderer) {
        this.composite.stop(boardRenderer);
    }
}
/** Changes color of hovered object */
class EmphasizeHoveredObject extends BoardBehavior {
    constructor(rendererFilter) { // a function: bool filter(renderer);
        super();
        this._oldHsl = null;
        this._rendererFilter = rendererFilter || function(r) { return true; };
    }
    enter(boardRenderer, renderer) {
        if (!this._rendererFilter(renderer)) {
            return;
        }
        if (renderer.mesh.material.color !== undefined) {
            var hsl = renderer.mesh.material.color.getHSL();
            renderer.mesh.material.color.setHSL(hsl.h, hsl.s, 0.1);
            this._oldHsl = {h: hsl.h, s: hsl.s, l: hsl.l};
        }
    }
    leave(boardRenderer, renderer) {
        if (!this._rendererFilter(renderer)) {
            return;
        }
        if (this._oldHsl !== null && renderer.mesh.material.color !== undefined) {
            renderer.mesh.material.color.setHSL(this._oldHsl.h, this._oldHsl.s, 0.5);
        }
    }
}
/** Dispatches behavior onto given behaviors */
class CompositeBehavior extends BoardBehavior {
    constructor(...behaviors) {
        super();
        this.behaviors = behaviors;
    }
    start(boardRenderer) {
        for (var behavior of this.behaviors) {
            behavior.start(boardRenderer);
        }
    }
    stop(boardRenderer) {
        for (var behavior of this.behaviors) {
            behavior.stop(boardRenderer);
        }
    }
    click(boardRenderer, renderer) {
        for (var behavior of this.behaviors) {
            behavior.click(boardRenderer, renderer);
        }
    }
    enter(boardRenderer, renderer) {
        for (var behavior of this.behaviors) {
            behavior.enter(boardRenderer, renderer);
        }
    }
    leave(boardRenderer, renderer) {
        for (var behavior of this.behaviors) {
            behavior.leave(boardRenderer, renderer);
        }
    }
}
class SetPort {
    constructor() {
        this.selectedHexPartRenderer = null;
        this.selectedHexRenderer = null;
        this._portType = proto.carcattonne_data.PortType.Clay2To1;
    }
    get portType() {
        return this._portType;
    }
    set portType(portType) {
        this._portType = portType;
        this.portPickerRenderer.portType = this.portType;
    }
    start(boardRenderer) {
        this.portPickerRenderer = boardRenderer.portPickerRenderer;
        boardRenderer.portPickerRenderer.visible = true;
    }
    stop(boardRenderer) {
        boardRenderer.portPickerRenderer.visible = false;
    }
    click(boardRenderer, renderer) {
        if (this.selectedHexRenderer != null) {
            var newPort = Port.fromType(this.portType, this.selectedHexPartRenderer.partIndex, this.selectedHexRenderer.hex.coord);
            this.selectedHexRenderer.hex.port = newPort;
        }
    }
    enter(boardRenderer, renderer) {
        if (renderer instanceof HexRenderer) {
            boardRenderer.portPickerRenderer.visible = renderer.hex.canHavePort;
            boardRenderer.portPickerRenderer.hex = renderer.hex;
            this.selectedHexRenderer = renderer;
        }
        if (renderer instanceof HexPartRenderer) {
            this.selectedHexPartRenderer = renderer;
            this.selectedHexPartRenderer.hovered = true;
        }
    }
    leave(boardRenderer, renderer) {
        if (this.selectedHexPartRenderer != null) {
            this.selectedHexPartRenderer.hovered = false;
            this.selectedHexPartRenderer = null;
        }
    }
}