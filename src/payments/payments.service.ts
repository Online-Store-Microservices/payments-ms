import { Inject, Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { ClientProxy } from '@nestjs/microservices';
import { Request, Response } from 'express';
import { CreatePaymentSessionDto } from './dto/create-payment-session.dto';
import { NATS_SERVICE, envs } from 'src/config';

@Injectable()
export class PaymentsService {
  private readonly stripe = new Stripe(envs.stripeSecret);
  private readonly logger = new Logger('PaymentsService');

  constructor(
    @Inject(NATS_SERVICE) private readonly client: ClientProxy
  ) {}

  async createSession(createPaymentSessionDto: CreatePaymentSessionDto){
    const {currency,items,orderId} = createPaymentSessionDto;

    const lineItems = items.map((item)=>{
      return {
        price_data:{
          currency,
          product_data:{
            name: item.name
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity
      }
    });

    const session = await this.stripe.checkout.sessions.create({
      payment_intent_data:{
        metadata:{
          orderId
        }
      },
      line_items:lineItems,
      mode: 'payment',
      success_url: envs.stripeSuccessUrl,
      cancel_url: envs.stripeCancelUrl
    });

    return {
      cancelUrl: session.cancel_url,
      successUrl: session.success_url,
      url: session.url
    };
  }

  async stripeWebhook(req: Request, res: Response) {
    const sig = req.headers['stripe-signature'];

    let event: Stripe.Event;

    const endpointSecret = envs.stripeEndpointSecret;

    try {
      event = this.stripe.webhooks.constructEvent(
        req['rawBody'],
        sig,
        endpointSecret,
      );
    } catch (err) {
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }
    
    switch( event.type ) {
      case 'charge.succeeded': 
        const chargeSucceeded = event.data.object;
        const payload = {
          stripePaymentId: chargeSucceeded.id,
          orderId: chargeSucceeded.metadata.orderId,
          receiptUrl: chargeSucceeded.receipt_url,
        }        
        this.client.emit('payment_succeded', payload );
      break;
      
      default:
        this.logger.log(`Event ${ event.type } not handled`);
    }

    return res.status(200).json({ sig });
  }
}
