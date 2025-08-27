// services/mercadopago/subscription.ts
import { MercadoPagoConfig, PreApproval } from "mercadopago";

// Verificar token al inicio
if (!process.env.NEXT_PUBLIC_MP_ACCESS_TOKEN) {
  console.error('❌ NEXT_PUBLIC_MP_ACCESS_TOKEN is not set in environment variables');
}

const mercadopago = new MercadoPagoConfig({
  accessToken: process.env.NEXT_PUBLIC_MP_ACCESS_TOKEN || "APP_USR-7366560118688926-080710-c2dc819b223e50bb982e03bcc4b26952-2546073099",
});

const PLANS = [
  {
    id: '3d599a04-2792-4862-b24a-7eaa35a72af5',
    name: 'FREE',
    amount: 0.00,
    reason: 'Suscripción Plan FREE',
    features: ['All Features for 14 days']
  },
  {
    id: '26486f38-5d1b-445b-8d8a-feb87f90dd3c',
    name: 'BASICO',
    amount: 480,
    reason: 'Suscripción Plan BASICO',
    features: [
      'Chatbot Inteligente para WhatsApp',
      'Constructor de tu sitio Web'
    ]
  },
  {
    id: '469c145d-3ed8-42c2-be32-89e8c33fc648',
    name: 'MEJORADO',
    amount: 1000,
    reason: 'Suscripción Plan MEJORADO',
    features: [
      'Chatbot Inteligente (WhatsApp, Instagram, Facebook)',
      'Constructor de tu sitio web',
      'Gestor de redes sociales automatizable',
      'Panel de control de métricas y analíticas'
    ]
  },
  {
    id: '703b2211-f9c6-421a-bc36-abe9188cb40e',
    name: 'AVANZADO',
    amount: 1400,
    reason: 'Suscripción Plan AVANZADO',
    features: [
      'Chatbot Inteligente (WhatsApp, Instagram, Facebook)',
      'Constructor de tu sitio web',
      'Gestor de redes sociales automatizable',
      'Sistema de reservas y cobros online',
      'Panel de control de métricas y analíticas'
    ]
  },
  {
    id: '85424b68-2c3e-4519-9893-4fbfe30aa314',
    name: 'PREMIUM',
    amount: 1800,
    reason: 'Suscripción Plan PREMIUM',
    features: [
      'Chatbot Inteligente (WhatsApp, Instagram, Facebook)',
      'Constructor de tu sitio web',
      'Gestor de redes sociales automatizable',
      'Sistema de reservas y cobros online',
      'Panel de control de métricas y analíticas',
      'CRM para fidelizar clientes'
    ]
  }
] as const;

function findPlanByUUID(uuid: string) {
  return PLANS.find(plan => plan.id === uuid);
}

// FUNCIÓN CORREGIDA - Devuelve datos planos, no NextResponse
export async function createPreaproval(email: string, planId: string) {
  try {
    // Validaciones
    if (!email) {
      return { 
        error: 'Email is required',
        status: 400 
      };
    }

    console.log('##############DEBUG->:', email, planId);
    
    const selectedPlan = findPlanByUUID(planId);
    if (!selectedPlan) {
      console.log('Invalid plan. Available plans:', PLANS.map(p => ({ id: p.id, name: p.name })));
      return { 
        error: 'Invalid plan selected',
        status: 400 
      };
    }
    
    console.log('######################DEBUG->:', selectedPlan);

    // Crear la suscripción en MercadoPago
    const preApprovalApi = new PreApproval(mercadopago);
    
    const subscriptionData = {
      back_url: process.env.NEXT_PUBLIC_MP_REDIRECT_URI || "https://investigators-depend-indianapolis-advocacy.trycloudflare.com",
      reason: selectedPlan.reason,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months" as const,
        transaction_amount: selectedPlan.amount,
        currency_id: "UYU",
      },
      payer_email: email,
      status: "pending" as const,
    };

    console.log('📤 Sending to MercadoPago:', subscriptionData);

    const subscription = await preApprovalApi.create({
      body: subscriptionData
    });

    console.log('✅ MercadoPago response received:', {
      id: subscription.id,
      init_point: subscription.init_point,
      status: subscription.status
    });

    // Verificar que tenemos init_point
    if (!subscription.init_point) {
      console.error('❌ No init_point received from MercadoPago');
      console.log('Full subscription object:', JSON.stringify(subscription, null, 2));
      return {
        error: 'MercadoPago did not return a checkout URL',
        status: 500
      };
    }

    // RETORNAR SOLO LOS DATOS (no NextResponse)
    return {
      init_point: subscription.init_point,
      subscription_id: subscription.id,
      plan: {
        id: selectedPlan.id,
        name: selectedPlan.name,
        amount: selectedPlan.amount,
      }
    };

  } catch (error: any) {
    console.error('❌ Subscription error:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      cause: error.cause,
      response: error.response?.data
    });

    // Para error 401 de MercadoPago
    if (error.status === 401) {
      return {
        error: 'Payment service authentication failed. Check MP_ACCESS_TOKEN',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        status: 500
      };
    }

    return {
      error: 'Failed to create subscription',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      status: 500
    };
  }
}

// Función auxiliar para obtener los planes
export function getPlans() {
  return PLANS.map(plan => ({
    id: plan.id,
    name: plan.name,
    amount: plan.amount,
    features: plan.features,
  }));
}