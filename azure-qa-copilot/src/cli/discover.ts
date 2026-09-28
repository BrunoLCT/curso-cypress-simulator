import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { parseArgs } from 'node:util';
import { AzureApiError, AzureReadOnlyClient } from '../azure/client.js';
import { runDiscovery } from '../discovery/run.js';

const HELP = `Azure QA Copilot - Fase 1: descoberta SOMENTE LEITURA

Uso:
  npm run discover -- --work-item <ID> [--plan <ID>] [--suite <ID>] [--test-case <ID>] [opções]

Credenciais (variáveis de ambiente ou .env; o PAT NUNCA é aceito por argumento):
  AZDO_ORG, AZDO_PROJECT, AZDO_PAT, [AZDO_BASE_URL]

Opções:
  --work-item   ID da demanda (obrigatório)
  --plan        ID do Test Plan (sem ele, lista os planos e para)
  --suite       ID de uma Test Suite existente (usada para achar um Test Case)
  --test-case   ID de um Test Case real (senão usa o primeiro da suíte)
  --out         pasta dos JSON (padrão: discovery)
  --report      caminho do relatório (padrão: ../docs/azure-qa-copilot/DESCOBERTA-AMBIENTE.md)
  --mask        mascara nomes, e-mails e o nome da organização
  --no-samples  não inclui títulos/trechos de texto no relatório
  --help
Nenhuma operação de escrita é executada no Azure.`;

const { values: v } = parseArgs({
  options: {
    'work-item': { type: 'string' },
    plan: { type: 'string' },
    suite: { type: 'string' },
    'test-case': { type: 'string' },
    out: { type: 'string', default: 'discovery' },
    report: { type: 'string', default: '../docs/azure-qa-copilot/DESCOBERTA-AMBIENTE.md' },
    mask: { type: 'boolean', default: false },
    'no-samples': { type: 'boolean', default: false },
    help: { type: 'boolean', default: false },
  },
  strict: true,
});

const num = (name: string, raw: string | undefined): number | undefined => {
  if (raw === undefined) return undefined;
  if (!/^\d+$/.test(raw)) throw new Error(`--${name} deve ser um número inteiro.`);
  return Number(raw);
};

async function main(): Promise<number> {
  if (v.help || !v['work-item']) {
    console.log(HELP);
    return v.help ? 0 : 1;
  }
  const organization = process.env.AZDO_ORG ?? '';
  const project = process.env.AZDO_PROJECT ?? '';
  const pat = process.env.AZDO_PAT ?? '';
  if (!organization || !project || !pat) {
    console.error('Defina AZDO_ORG, AZDO_PROJECT e AZDO_PAT (ver .env.example).');
    return 1;
  }
  const client = new AzureReadOnlyClient({ organization, project, pat, baseUrl: process.env.AZDO_BASE_URL });
  const result = await runDiscovery(
    client,
    {
      workItemId: num('work-item', v['work-item']) as number,
      planId: num('plan', v.plan),
      suiteId: num('suite', v.suite),
      testCaseId: num('test-case', v['test-case']),
      outDir: v.out as string,
      reportPath: v.report as string,
      mask: v.mask as boolean,
      samples: !v['no-samples'],
      organization,
      project,
      pat,
    },
    {
      write: async (p, c) => {
        await mkdir(dirname(p), { recursive: true });
        await writeFile(p, c, 'utf8');
      },
      log: (m) => console.log(m),
      now: () => new Date(),
    },
  );
  if (result.exitCode === 2) console.log('\nParado: informe --plan para continuar a descoberta.');
  return result.exitCode;
}

main().then(
  (code) => process.exit(code),
  (e: unknown) => {
    console.error(e instanceof AzureApiError ? e.message : `Erro: ${(e as Error).message}`);
    process.exit(1);
  },
);
