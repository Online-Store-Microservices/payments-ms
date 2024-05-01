import { Controller, Get, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { PaymentsService } from './payments.service';
import { CreatePaymentSessionDto } from './dto/create-payment-session.dto';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}



  @MessagePattern('create_session_payment')
  createSession(@Payload() createPaymentSessionDto: CreatePaymentSessionDto){
    return this.paymentsService.createSession(createPaymentSessionDto);
  }

  @Get('success')
  success(){
    return {
      ok: true,
      message: 'Payment successful'
    };
  }

  @Get('cancel')
  cancel(){
    return {
      ok: false,
      message: 'Payment cancelled'
    };
  }

  @Post('webhook')
  async stripeWebhook(@Req() req: Request, @Res() res: Response){
    return this.paymentsService.stripeWebhook(req,res);
  }
 
}
