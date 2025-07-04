import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})
export class WebrtcGateway {
  @WebSocketServer()
  server: Server;

  private users = new Map<string, string>(); // userId -> socket.id

  handleConnection(client: Socket) {
    console.log(`Client connecté : ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      this.users.delete(userId);
      this.server.emit('user_offline', userId);
    }
    console.log(`Client déconnecté : ${client.id}`);
  }

  @SubscribeMessage('register')
  handleRegister(@MessageBody() userId: string, @ConnectedSocket() client: Socket) {
    if (this.users.has(userId)) {
      client.emit('registration_failed', `L'ID ${userId} est déjà utilisé.`);
      return;
    }
    this.users.set(userId, client.id);
    client.data.userId = userId;
    client.emit('registered', userId);
    this.server.emit('user_online', userId);
  }

  @SubscribeMessage('call_user')
  handleCallUser(
    @MessageBody() data: { targetId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const targetSocketId = this.users.get(data.targetId);
    const callerId = client.data.userId;
    if (!callerId) {
      client.emit('call_failed', 'Vous devez être enregistré.');
      return;
    }
    if (targetSocketId && targetSocketId !== client.id) {
      this.server.to(targetSocketId).emit('incoming_call', { callerId });
      client.emit('call_initiated', data.targetId);
    } else {
      client.emit('call_failed', `L'utilisateur ${data.targetId} n'est pas en ligne.`);
    }
  }

  @SubscribeMessage('offer')
  handleOffer(
    @MessageBody() data: { targetId: string; sdp: any },
    @ConnectedSocket() client: Socket,
  ) {
    const targetSocketId = this.users.get(data.targetId);
    if (targetSocketId) {
      this.server.to(targetSocketId).emit('offer', {
        from: client.data.userId,
        sdp: data.sdp,
      });
    }
  }

  @SubscribeMessage('answer')
  handleAnswer(
    @MessageBody() data: { targetId: string; sdp: any },
    @ConnectedSocket() client: Socket,
  ) {
    const targetSocketId = this.users.get(data.targetId);
    if (targetSocketId) {
      this.server.to(targetSocketId).emit('answer', {
        from: client.data.userId,
        sdp: data.sdp,
      });
    }
  }

  @SubscribeMessage('candidate')
  handleCandidate(
    @MessageBody() data: { targetId: string; candidate: any },
    @ConnectedSocket() client: Socket,
  ) {
    const targetSocketId = this.users.get(data.targetId);
    if (targetSocketId) {
      this.server.to(targetSocketId).emit('candidate', {
        from: client.data.userId,
        candidate: data.candidate,
      });
    }
  }

  @SubscribeMessage('hangup_call')
  handleHangup(
    @MessageBody() data: { targetId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const targetSocketId = this.users.get(data.targetId);
    if (targetSocketId) {
      this.server.to(targetSocketId).emit('call_ended', {
        from: client.data.userId,
      });
    }
    client.emit('call_ended', { from: client.data.userId });
  }
}
