import { GameClient, Player, Param, ScriptComponent, GameRoom } from '@oo/scripting'

/**
 * 
 * Check documentation here:
 * 
 * https://doocs.oncyber.io/multiplayer
 * 
 */

export default class Multiplayer extends ScriptComponent {

    room: GameRoom<any,any,any> = null;

    playerSync = null

    hasConnected = false

    @Param({ name: "URL (Keep empty to use our default server)" })
    url = ""

    @Param
    enable = true

    async connect() {

        try {

            this.room = GameClient.join({ 
                
                host: this.url, 
            
            })

            await this.room.ready

            this.playerSync = this.room.getPlayerStateSync()

            this.room.onMessage(console.log)

            if (this.isHost) {

                await this.room.requestStart(0);
            
            }

            this.hasConnected = true;
            
            this.room.onDisconnect(() => this.onDisconnect())

        }
        catch(err) {

            console.error("Multiplayer/connect",  err)
        }
    }

    get ready() {

        return this.room.ready
    }

    get me() {

        return this.room.state.players.get(Player.sessionId)
    }

    get isHost() {

        return this.room.isHost
    }

    onDisconnect = () => {

        console.error("Room disconnected! refresh and try again")
        
    }

    disconnect() {

        if (this.room) {

            this.room?.leave()

        }
    }

    broadcast = (message) => {

        this.room.send({
            type: "broadcast", 
            payload: {
                from: {
                    sessionId: Player.sessionId
                },
                ...message
            },
        })

    }

    onPreload = async () => {

        if (this.enable) {

            await this.connect();
        
        }

    }

    onUpdate = (dt) => {

         if ( this.hasConnected ) {
            
            this.playerSync.update(dt)
        
        }
    
    }

    onDispose = async () => {

        if (this.room) {

            this.disconnect();

        }

    }
}

