# language: pt
Funcionalidade: US 01 — Parametrização das travas (T41TRAVA)

  @CT01 @alta
  Cenário: Configurar tempo mínimo e quantidade máxima por especialidade detalhe e filial
    Dado que sou um administrador com acesso à T41TRAVA
    Quando configuro tempo mínimo em horas e quantidade máxima para uma especialidade detalhe em uma filial
    E salvo a parametrização
    Então os valores ficam armazenados vinculados à combinação especialidade detalhe x filial
    E a alteração é registrada no histórico com usuário, data/hora e valores anterior e atual

  @CT02 @alta
  Cenário: Configurar faixa etária por especialidade detalhe e filial
    Dado que sou um administrador com acesso à T41TRAVA
    Quando defino idade mínima e idade máxima para uma especialidade detalhe em uma filial
    Então o sistema armazena a faixa etária vinculada à combinação especialidade detalhe x filial
    E a alteração é registrada no histórico

  @CT03 @alta @pendente-refinamento @D4
  Esquema do Cenário: Configurar limite de frequência com comportamento ao atingir
    Dado que sou um administrador com acesso à T41TRAVA
    Quando configuro quantidade máxima <qtd>, intervalo de <horas> horas e comportamento "<comportamento>"
    Então o sistema aceita e armazena os valores
    E registra a alteração no histórico com usuário, data/hora e valores anterior e atual

    Exemplos:
      | qtd | horas | comportamento                      |
      | 3   | 24    | Com justificativa                  |
      | 2   | 48    | Sem justificativa (Trava Total)    |

  @CT04 @alta
  Cenário: Registrar histórico de todas as alterações da parametrização
    Dado que uma especialidade detalhe possui tempo mínimo 24 configurado
    Quando altero o tempo mínimo para 48 e a faixa etária máxima
    Então o histórico exibe um registro por campo alterado
    E cada registro contém usuário, data/hora, valor anterior e valor atual

  @CT05 @media @pendente-refinamento @D14
  Cenário: Assumir 0 quando a quantidade não é informada
    Dado que sou um administrador na T41TRAVA
    Quando salvo uma especialidade detalhe sem informar a quantidade máxima
    Então o campo é gravado com o valor 0

  @CT06 @alta
  Cenário: Permitir solicitação sem parametrização de tempo ou limite
    Dado que a especialidade detalhe x filial não possui tempo mínimo nem limite de frequência
    Quando o médico solicita teleparecer dessa especialidade
    Então o sistema permite a solicitação normalmente, sem restrição

  @CT07 @alta @pendente-refinamento @D1
  Cenário: Usar o Controle de Tempo geral quando a especialidade não tem tempo
    Dado que a especialidade detalhe não possui tempo parametrizado
    E que o Controle de Tempo geral é de 48 horas
    E que existe solicitação da especialidade há 10 horas
    Quando o médico tenta solicitar novamente
    Então o sistema considera o tempo de 48 horas do Controle de Tempo geral

  @CT08 @alta
  Esquema do Cenário: Contar o tempo a partir da data/hora da solicitação
    Dado que o tempo mínimo é de 24 horas
    E que existe parecer solicitado às 08:00 com status <status>
    E que foi respondido/cancelado às 20:00
    Quando o médico consulta a opção às 10:00 do mesmo dia
    Então o tempo restante exibido é "22h 0min" contado a partir das 08:00

    Exemplos:
      | status    |
      | Finalizado |
      | Pendente  |
      | Cancelado |

  @CT09 @alta
  Cenário: Manter a trava de solicitação em andamento no mesmo atendimento
    Dado que existe solicitação em andamento/pendente da especialidade no mesmo atendimento
    Quando o médico tenta solicitar novamente
    Então prevalece o comportamento atual do sistema (solicitação não permitida)

  @CT10 @media @pendente-refinamento @D14
  Cenário: Aplicar parametrização diferente por filial
    Dado que a filial A tem tempo mínimo de 24 horas e a filial B tem 6 horas
    E que existe parecer da especialidade há 10 horas no paciente
    Quando o médico da filial A e o médico da filial B consultam a opção
    Então na filial A a opção está bloqueada
    E na filial B a opção está habilitada

  @CT11 @media @pendente-refinamento @D14
  Esquema do Cenário: Rejeitar valores inválidos
    Dado que sou um administrador na T41TRAVA
    Quando informo <campo> = "<valor>"
    Então o sistema <resultado>

    Exemplos:
      | campo             | valor | resultado                     |
      | tempo mínimo      | -1    | rejeita o valor               |
      | quantidade máxima | abc   | rejeita o valor               |
      | idade mínima maior que a máxima | 60 / 18 | rejeita o valor |
      | tempo mínimo      | 0     | conforme definição do PO      |

  @CT12 @media
  Cenário: Configurar janela de horas do lembrete de parecer recente
    Dado que sou um administrador na T41TRAVA
    Quando informo a janela de horas do lembrete para uma especialidade detalhe x filial
    Então o valor é gravado de forma independente do limite de frequência
    E a alteração é registrada no histórico

