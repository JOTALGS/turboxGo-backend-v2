import { MercadoPagoConfig, PreApproval } from "mercadopago";

const mercadopago = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

export async function updatePlan(type: string, notification: any) {
  console.log("############DEBUG############# [webhook]", notification);

  if (type === "subscription_preapproval") {
    const preapproval = await new PreApproval(mercadopago).get({id: notification.id});

    if (preapproval.status === "authorized") {
      //await api.user.update({plan_id: preapproval.id});
    }
  }

  return new Response(null, {status: 200});
}
