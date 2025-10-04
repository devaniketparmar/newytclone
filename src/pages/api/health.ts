import { NextApiRequest, NextApiResponse } from 'next';
import { healthCheck } from '../../middleware/database';

export default healthCheck;
