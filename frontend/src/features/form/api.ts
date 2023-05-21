import axios from 'axios';
import { ItemState, MileageState } from './formSlice';

export interface postInterface {
  name: string;
  iban: string;
  title: string;
  contact: string;
  govId: string | null;
  itemms: Array<ItemState>;
  mileages: Array<MileageState>;
}

export const postForm = async (payload: postInterface) => {
  const response = await axios.post('/api/entry', payload);
  return response.data
};