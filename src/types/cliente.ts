export interface Cliente {
  nome: string;
  documento: string;
  contato?: string;
  email?: string;
  cep?: string;
  rua?: string;
  numero?: string;
  complemento?: string; // Opcional, pois pode vir vazio
  bairro?: string;
  cidade?: string;
  estado?: string;
}
