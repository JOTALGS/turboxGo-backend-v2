// routes/mercadopago.ts (o donde tengas tu router)
import { Router } from 'express';
import type { Request, Response } from 'express';
import { createPreaproval } from '../services/mercadopago/subscription';
import { updatePlan } from '../services/mercadopago/webhook';

const router = Router();

router.post('/subscription', async (req: Request, res: Response) => {
  try {
    const { email, planId } = req.body;
    console.log('Creating Mercado Pago subscription:', { email, planId });
    
    // Llamar al servicio
    const response = await createPreaproval(email, planId);
    
    // Verificar si hay error en la respuesta
    if ('error' in response) {
      console.error('Error from createPreaproval:', response.error);
      const statusCode = response.status || 500;
      return res.status(statusCode).json({ 
        error: response.error,
        details: response.details 
      });
    }
    
    // Si todo salió bien, devolver el init_point
    console.log('✅ Success! Init point:', response.init_point);
    return res.status(201).json(response);
    
  } catch (error) {
    console.error('Router error:', error);
    return res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const notification = req.body;
    console.log('Received Mercado Pago webhook:', notification);
    
    const { type, data } = notification;
    await updatePlan(type, data);
    
    // MercadoPago espera un 200 OK
    res.status(200).send('OK');
    
  } catch (error) {
    console.error('Webhook error:', error);
    // Aún así devolver 200 para que MP no reintente
    res.status(200).send('OK');
  }
});

export { router as mercadopagoRoutes };