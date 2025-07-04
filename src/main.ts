import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import 'reflect-metadata';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 🔓 CORS pour autoriser le frontend
  app.enableCors({
    origin: true, // Permet toutes les origines en développement
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Access-Control-Allow-Origin'],
  });

  // 📚 Swagger setup
    const config = new DocumentBuilder()
    .setTitle('Njureel API')
    .setDescription('Documentation de l\'API Njureel pour le mobile Flutter')
    .setVersion('1.0')
    .addTag('auth')
    .addBearerAuth() 
    .build();
  

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // ➜ http://192.168.8.3:3000/api

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
