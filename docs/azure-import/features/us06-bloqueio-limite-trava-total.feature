# language: pt
Funcionalidade: US 06 — Bloqueio ao atingir o limite (Trava Total)

  @CT43 @alta @pendente-refinamento @D4
  Cenário: Exibir alerta com a relação de pareceres e apenas "Voltar"
    Dado que a especialidade x filial tem limite máximo e comportamento "Sem justificativa (Trava Total)"
    E que o paciente já possui pareceres em quantidade igual ao limite no período
    Quando o médico tenta solicitar um novo teleparecer dessa especialidade
    Então o sistema exibe alerta informando que o limite foi atingido
    E lista os pareceres do período com data, hora e responsável pela resposta
    E informa o tempo faltante para nova solicitação
    E disponibiliza apenas a opção "Voltar"

  @CT44 @alta
  Esquema do Cenário: Comparar respondidos com o limite
    Dado que o limite máximo é <limite>
    E que o paciente possui <respondidos> pareceres respondidos no período
    Quando o médico solicita novo teleparecer da especialidade
    Então a solicitação é <resultado>

    Exemplos:
      | limite | respondidos | resultado  |
      | 3      | 2           | permitida  |
      | 3      | 3           | bloqueada  |
      | 3      | 4           | bloqueada  |

  @CT45 @media
  Cenário: Voltar do alerta de Trava Total
    Dado o alerta de Trava Total exibido
    Quando o médico clica em "Voltar"
    Então retorna à tela de solicitação
    E nenhuma solicitação é criada

