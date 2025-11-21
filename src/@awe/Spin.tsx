import { Param, ScriptBehavior } from '@oo/scripting'

export default class Spin extends ScriptBehavior {

    static config = {
        description: "Rotate an object around an axis"
    }

    @Param({type:"number"})
    speed = 1;
    @Param({type:"select", mode: "buttons", options: ["x", "y", "z"]})
    axis = "y";

    onFrame = (delta) => {
        this.host.rotation[this.axis] += this.speed * delta;
    }

}