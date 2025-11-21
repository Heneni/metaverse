import { ScriptBehavior, Component3D } from '@oo/scripting'

export default class MyBehavior extends ScriptBehavior<Component3D> {

    static config = {
        title: "MyBehavior",
    }

    onReady = () => {
        // invoked once when the game has finished loading
        console.log("Behavior attached to", this.host);
    }

    onStart = () => {
        // invoked each time user starts or replays the game (everytime World.start() is called, we call it by default in Display script)
    }

    onUpdate = (dt: number) => {
        // this will be invoked on each frame (assuming the game is not paused)
    }
}