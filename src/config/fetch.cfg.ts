import { Card } from "../models/_types";

export const getImageURI = ({ scryfallId = '' }: Partial<Card>) => scryfallId && `${scryfallId}`