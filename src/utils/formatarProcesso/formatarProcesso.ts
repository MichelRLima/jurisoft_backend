export default function formatarProcesso(numero: string) {
  // Remove qualquer caractere que não seja número, caso a entrada venha suja
  const limpo = numero.replace(/\D/g, "");

  // Verifica se tem os 20 dígitos necessários
  if (limpo.length !== 20) {
    return "Número inválido (deve conter 20 dígitos)";
  }

  // Aplica a máscara: NNNNNNN-DD.AAAA.J.TR.OOOO
  return limpo.replace(
    /^(\d{7})(\d{2})(\d{4})(\d{1})(\d{2})(\d{4})$/,
    "$1-$2.$3.$4.$5.$6",
  );
}
