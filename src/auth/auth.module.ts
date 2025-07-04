import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { Address } from '../entities/address.entity';
import { Profile } from '../entities/profile.entity';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotificationModule } from '../services/notification.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forFeature([User, Role, Profile, Address]), 
    NotificationModule,
    PassportModule.register({ defaultStrategy: 'jwt' }), 
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: { expiresIn: '1h' }, // ✅ Définit une expiration du token
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy], // ✅ Ajoute JwtStrategy
  exports: [AuthService], // ✅ Exporte pour l'utiliser ailleurs
})
export class AuthModule {}
