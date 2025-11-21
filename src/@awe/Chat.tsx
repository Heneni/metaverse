import { Components, Player, OOUI, ScriptComponent } from '@oo/scripting'


export default class Chat extends ScriptComponent {

    dialog = null;

    dialogs = {}

    multiplayer = null


    onReady = () => {

        this.multiplayer = Components.byId("multiplayer")

        if (this.multiplayer.instance.hasConnected) {

            OOUI.showChat = true;

            this.multiplayer.instance.room.onPlayerLeft((player) => {

                const dialog = this.dialogs[player.sessionId];

                if (dialog) {
                    
                    dialog.destroy();

                    delete this.dialogs[player.sessionId]

                }
            })

            this.multiplayer.instance.room.onMessage((message) => {

                const { payload } = message;

                if (payload.type === "message") {

                    const sessionId = message.payload.from.sessionId 

                    if (sessionId === Player.sessionId) return;
                    
                    this._sendReceiveMessageEvent(payload.message)

                    if (this.multiplayer.instance.room.players[sessionId]) {

                        this.createDialog(

                            sessionId,

                            this.multiplayer.instance.room.players[sessionId].avatar,

                            message.payload.message.text

                        )

                    }

                }

            })

            this._onSendMessage(this.handleSendMessage)

        }
    }

    handleSendMessage = async (e) => {

        this.multiplayer.instance.broadcast({

            type: "message",
            
            message: e.detail,
        
        });

        this.createDialog(Player.sessionId, Player.avatar, e.detail.text);
        
    }

   async createDialog( userId, target, text ) {

        if (this.dialogs?.[userId]) {

            this.dialogs[userId].destroy();

            this.dialogs[userId] = null;

        }

        if (!target) return;

        this.dialogs[userId] = await Components.create({

            type: 'dialog',

            backgroundColor: 0x000000,
            
            width: 1200,
            
            align:'left',
            
            billboard: true,

            backgroundOpacity: 0.75

        })

        this.dialogs[userId].userData.target = target

        this.dialogs[userId].position.copy(target.position)

        this.dialogs[userId].scale.set(0.5, 0.5, 0.5)

        this.dialogs[userId].showScript({

            texts: [
                
                text,
            
            ],

            speed: 0.02,
            
            delay: 8
        
        })

        const targetHeight = target.getBBox().max.y - target.getBBox().min.y

        const dialogHeight = this.dialogs[userId].getDimensions().y

        this.dialogs[userId].position.y = target.position.y + targetHeight + (dialogHeight / 2)
    }

    onUpdate = () => {

        Object.values(this.dialogs).forEach((dialog: any) => {

            if (!dialog) return;

            const target = dialog.userData.target;

            if (!target) return;

            dialog.position.copy(target.position);

            const targetHeight = target.getBBox().max.y - target.getBBox().min.y
        
            const dialogHeight = dialog.getDimensions().y

            dialog.position.y = target.position.y + targetHeight + (dialogHeight / 2)

        })
        
    }

    onDispose() {

        this._offSendMessage(this.handleSendMessage)

    }


    _sendReceiveMessageEvent(newMessage) {

        window.dispatchEvent(new CustomEvent("receive-message", {

            detail: newMessage,

        }));

    }

    _onSendMessage(callback) {

        window.addEventListener("send-message", callback);

    }

    _offSendMessage(callback) {

        window.removeEventListener("send-message", callback);

    }

}

