# language: pt
Funcionalidade: US 03 — Modal de justificativa e caso clínico

  @CT30 @alta @pendente-refinamento @D3
  Cenário: Exibir a modal com limite, campos e saldo
    Dado que o limite foi atingido e o comportamento é "Com justificativa"
    Quando o médico tenta prosseguir com a solicitação
    Então a modal informa que o limite foi atingido
    E exibe a quantidade já utilizada e o saldo restante
    E exibe o campo de justificativa e o campo de caso clínico

  @CT31 @alta
  Cenário: Exibir somente justificativas ativas com "Outro" ao final
    Dado que existem justificativas Ativas e Inativas cadastradas
    Quando o médico abre a lista de justificativas
    Então somente as Ativas são exibidas
    E a opção "Outro" aparece sempre por último

  @CT32 @alta
  Cenário: Exigir texto livre ao selecionar "Outro"
    Dado a modal de justificativa aberta
    Quando o médico seleciona "Outro"
    Então é exibido campo de texto livre obrigatório
    E não é possível confirmar sem preenchê-lo

  @CT33 @alta @pendente-refinamento @D3
  Esquema do Cenário: Confirmar somente com os dois campos
    Dado a modal de justificativa aberta
    Quando o médico preenche justificativa "<just>" e caso clínico "<caso>"
    Então a confirmação da solicitação é <resultado>

    Exemplos:
      | just          | caso          | resultado  |
      | vazia         | vazio         | bloqueada  |
      | preenchida    | vazio         | bloqueada  |
      | vazia         | preenchido    | bloqueada  |
      | só espaços    | preenchido    | bloqueada  |
      | preenchida    | preenchido    | permitida  |

  @CT34 @alta
  Cenário: Registrar justificativa e caso clínico
    Dado que o médico confirmou a solicitação com justificativa e caso clínico
    Quando consulto o log de auditoria
    Então há registro com justificativa, caso clínico, usuário, data/hora e especialidade detalhe

  @CT35 @media @pendente-refinamento @D14
  Esquema do Cenário: Inativar sim, excluir não
    Dado que existe uma justificativa cadastrada <tipo>
    Quando o administrador tenta <ação>
    Então o sistema <resultado>

    Exemplos:
      | tipo       | ação      | resultado          |
      | comum      | inativar  | permite            |
      | comum      | excluir   | não permite        |
      | "Outro"    | inativar  | não permite        |
      | "Outro"    | remover   | não permite        |

  @CT36 @alta
  Cenário: Não exibir a modal na Trava Total
    Dado que o limite foi atingido e o comportamento é "Sem justificativa (Trava Total)"
    Quando o médico tenta solicitar
    Então a modal de justificativa não é exibida

