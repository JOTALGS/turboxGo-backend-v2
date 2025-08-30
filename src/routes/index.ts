import { Router } from 'express';
import { userRoutes } from './userRoutes';
import { healthRoutes } from './healthRoutes';
import { siteRoutes } from './siteRoutes';
import { mercadopagoRoutes } from './mercadopagoRoutes';
import { builderRoutes } from './builderRoutes';
import { crmRoutes } from './crmRoutes';
import { businessRoutes } from './businessRoutes';

const router = Router();

router.use('/users', userRoutes);
router.use('/health', healthRoutes);
router.use('/publisher', siteRoutes);
router.use('/mercadopago', mercadopagoRoutes);
router.use('/builder', builderRoutes);
router.use('/business', businessRoutes);
router.use('/crm', crmRoutes);


export { router as apiRoutes };