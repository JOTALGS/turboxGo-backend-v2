import { Router } from 'express';
import { userRoutes } from './userRoutes';
import { healthRoutes } from './healthRoutes';
import { siteRoutes } from './siteRoutes';
import { mercadopagoRoutes } from './mercadopagoRoutes';
import { builderRoutes } from './builderRoutes';
import { crmRoutes } from './crmRoutes';

const router = Router();

router.use('/users', userRoutes);
router.use('/health', healthRoutes);
router.use('/publisher', siteRoutes);
router.use('/mercadopago', mercadopagoRoutes);
router.use('/builder', builderRoutes);
router.use('/crm', crmRoutes);


export { router as apiRoutes };