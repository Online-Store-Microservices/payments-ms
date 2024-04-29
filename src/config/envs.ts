import 'dotenv/config';
import * as joi from 'joi';

interface IEnvVars {
    PORT: number;
    NATS_SERVERS: string[];
    STRIPE_SECRET:string;
    STRIPE_ENDPOINT_SECRET: string
}

const envsSchema = joi.object({
    PORT: joi.number().required(),
    NATS_SERVERS: joi.array().items(joi.string().required()),
    STRIPE_SECRET: joi.string().required(),
    STRIPE_ENDPOINT_SECRET: joi.string().required()
})
.unknown(true);

const {error,value} = envsSchema.validate({
    ...process.env,
    NATS_SERVERS: process.env.NATS_SERVERS?.split(',')
});

if (error) {
    throw new Error(`Config validation error: ${error.message}`);
}

const envVars : IEnvVars = value;

export const envs = {
    port: envVars.PORT,
    natsServers: envVars.NATS_SERVERS,
    stripeSecret: envVars.STRIPE_SECRET,
    stripeEndpointSecret: envVars.STRIPE_ENDPOINT_SECRET
}