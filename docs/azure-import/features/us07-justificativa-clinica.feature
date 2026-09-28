# language: pt
Funcionalidade: US 07 — Solicitação com justificativa clínica ao atingir o limite

  @CT46 @alta
  Cenário: Registrar a justificativa e criar o parecer
    Dado que o limite foi atingido e o comportamento é "Com justificativa"
    E o alerta exibe a lista de pareceres anteriores com data, hora e profissional
    Quando o médico preenche a justificativa clínica e clica em "Prosseguir com a solicitação"
    Então o sistema cria o parecer normalmente
    E a justificativa fica vinculada de forma permanente à solicitação
    E está disponível no histórico/auditoria do paciente

  @CT47 @alta
  Esquema do Cenário: Manter "Prosseguir com a solicitação" desabilitado
    Dado o alerta de limite atingido com justificativa
    Quando o campo de justificativa contém "<conteúdo>"
    Então o botão "Prosseguir com a solicitação" está <estado>

    Exemplos:
      | conteúdo       | estado       |
      | (vazio)        | desabilitado |
      | apenas espaços | desabilitado |
      | texto válido   | habilitado   |

  @CT48 @alta
  Esquema do Cenário: Validar o tamanho da justificativa
    Dado o alerta de limite atingido com justificativa
    Quando o médico informa <qtd> caracteres
    Então o sistema <resultado>
    E o contador exibe <contador>

    Exemplos:
      | qtd  | resultado                 | contador  |
      | 3999 | aceita                    | 3999/4000 |
      | 4000 | aceita                    | 4000/4000 |
      | 4001 | impede a digitação/colagem além de 4000 | 4000/4000 |

  @CT49 @media
  Cenário: Desistir de prosseguir
    Dado o alerta de limite atingido com justificativa
    Quando o médico clica em "Voltar"
    Então retorna à tela de solicitação de pareceres
    E não registra nova solicitação nem justificativa

  @CT50 @alta
  Cenário: Não exibir a exceção quando o comportamento é Trava Total
    Dado que o limite foi atingido e o comportamento é "Sem justificativa (Trava Total)"
    Quando o médico tenta solicitar
    Então o campo de justificativa e o botão "Prosseguir com a solicitação" não são exibidos

