# language: pt
Funcionalidade: US 08 — Lembrete de parecer recente com ciente

  @CT51 @alta
  Cenário: Exigir o ciente para solicitar mesmo assim
    Dado que existe parecer da especialidade dentro da janela do lembrete
    E que o limite máximo de frequência ainda não foi atingido
    Quando o médico seleciona a especialidade e tenta solicitar
    Então é exibido alerta com a data do parecer anterior
    E a lista dos demais pareceres da janela com data, hora e profissional
    E o checkbox "Estou ciente dos pareceres anteriores e reconheço a necessidade clínica de uma nova solicitação para este paciente."
    E o botão "Solicitar mesmo assim" está desabilitado até marcar o checkbox
    Quando o médico marca o checkbox e clica em "Solicitar mesmo assim"
    Então a solicitação prossegue

  @CT52 @alta
  Esquema do Cenário: Não exibir o lembrete
    Dado que <situação>
    Quando o médico solicita a especialidade
    Então o alerta de lembrete não é exibido
    E a solicitação segue normalmente

    Exemplos:
      | situação                                                                 |
      | não existe parecer da especialidade dentro da janela do lembrete          |
      | a especialidade x filial não possui janela do lembrete parametrizada      |

  @CT53 @media @pendente-refinamento @D8
  Cenário: Janela do lembrete diferente do intervalo do limite
    Dado que a janela do lembrete é de 12 horas e o intervalo do limite é de 48 horas
    E que existe parecer há 20 horas
    Quando o médico solicita a especialidade
    Então o lembrete não é exibido
    E a contagem do limite considera as 48 horas

  @CT54 @baixa
  Cenário: Voltar sem solicitar
    Dado o alerta de lembrete exibido
    Quando o médico clica em "Voltar"
    Então retorna à tela de solicitação sem criar parecer

