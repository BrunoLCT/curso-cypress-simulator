# Azure QA Copilot: Fase 1 (descoberta SOMENTE LEITURA)

Gera um "raio-X" do seu Azure DevOps para confirmar as hipóteses da Fase 0 **antes** de qualquer geração de cenários ou escrita.

**Nesta fase não existe nenhuma operação de escrita:** o cliente (`src/azure/client.ts`) só implementa `GET`. Não cria Test Case, não edita Work Item, não adiciona à suíte, não clona e não altera plano/suíte.

## Como usar
Requer Node >= 20.6.

```bash
cd azure-qa-copilot
npm install
cp .env.example .env        # preencha AZDO_ORG, AZDO_PROJECT, AZDO_PAT (o PAT só é lido daqui)

# 1) sem --plan: lista os planos existentes e para
npm run discover -- --work-item 12345

# 2) com o plano e uma suíte existente (o script usa o 1º Test Case da suíte)
npm run discover -- --work-item 12345 --plan 678 --suite 910 --mask

# ou informando o Test Case real, criado manualmente
npm run discover -- --work-item 12345 --plan 678 --test-case 4321 --mask
```

O PAT precisa de leitura em **Work Items** e em **Test Management**.

| Opção | Efeito |
|---|---|
| `--mask` | mascara nomes, e-mails, avatares e o nome da organização |
| `--no-samples` | omite títulos e trechos de texto do relatório |
| `--out` | pasta dos JSON (padrão `discovery/`) |
| `--report` | relatório (padrão `../docs/azure-qa-copilot/DESCOBERTA-AMBIENTE.md`) |

## Saídas
`discovery/work-item.json`, `test-plan.json`, `test-suites.json` (árvore + lista plana + resumo), `test-case.json`, além de `test-case-suites.json`, `relation-types.json` e o relatório `DESCOBERTA-AMBIENTE.md`.

**Campos do Test Case:**
- `test-case-fields.json` = **metadados dos campos** (`typeFields`: nome, `referenceName`, `alwaysRequired`, valor padrão, valores permitidos; `catalog`: tipo, `readOnly`, operações suportadas). O endpoint por tipo **não** devolve `type` nem `readOnly`; eles vêm do catálogo `GET wit/fields`.
- `test-case-field-usage.json` = por campo, o metadado + se está **preenchido no Test Case real** (sem gravar os valores).
- **Isto não é uma lista de campos obrigatórios.** A obrigatoriedade pode depender do tipo, do processo, do estado e de regras do projeto. Nesta fase somente leitura o "obrigatório confirmado" fica sempre **"não comprovado"**; `alwaysRequired=true` aparece apenas como "indicado pelo metadado".

> `discovery/` está no `.gitignore` porque contém dados reais do seu Azure. O relatório em `docs/` **não** está ignorado: revise antes de commitar.

## Segurança
- O PAT não é aceito por argumento de linha de comando, nunca é gravado e a execução **aborta** se ele aparecer em qualquer saída.
- Erros nunca incluem o PAT nem cabeçalhos.

## Testes
```bash
npm run typecheck && npm test
```
Os testes usam um Azure **simulado com dados sintéticos** (`tests/fixtures.ts`), totalmente separado do código real. Eles verificam que só há chamadas `GET`, que o PAT não vaza e que a máscara funciona.
