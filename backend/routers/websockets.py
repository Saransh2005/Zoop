import json
from typing import Dict, List
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter(tags=["websockets"])


class ConnectionManager:
    def __init__(self):
        # meeting_id -> List[WebSocket]
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, meeting_id: str, websocket: WebSocket):
        await websocket.accept()
        if meeting_id not in self.active_connections:
            self.active_connections[meeting_id] = []
        self.active_connections[meeting_id].append(websocket)

    def disconnect(self, meeting_id: str, websocket: WebSocket):
        if meeting_id in self.active_connections:
            if websocket in self.active_connections[meeting_id]:
                self.active_connections[meeting_id].remove(websocket)
            if not self.active_connections[meeting_id]:
                del self.active_connections[meeting_id]

    async def broadcast(self, meeting_id: str, message: dict, sender: WebSocket = None):
        if meeting_id in self.active_connections:
            payload = json.dumps(message)
            dead = []
            for connection in list(self.active_connections[meeting_id]):
                if connection != sender:
                    try:
                        await connection.send_text(payload)
                    except Exception:
                        dead.append(connection)
            for d in dead:
                self.disconnect(meeting_id, d)


manager = ConnectionManager()


@router.websocket("/ws/meeting/{meeting_id}")
async def websocket_endpoint(websocket: WebSocket, meeting_id: str):
    await manager.connect(meeting_id, websocket)
    try:
        while True:
            data_str = await websocket.receive_text()
            try:
                data = json.loads(data_str)
                # Broadcast incoming WS event to all other clients in the room
                await manager.broadcast(meeting_id, data, sender=websocket)
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        manager.disconnect(meeting_id, websocket)
        await manager.broadcast(meeting_id, {
            "type": "USER_LEFT",
            "message": "A participant left the meeting."
        })
