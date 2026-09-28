// Dados SINTÉTICOS para testes. Nada aqui vem de um Azure real.
export const PAT = 'pat-super-secreto-123';
export const ORG = 'minha-org';

export const workItem = {
  id: 100,
  rev: 3,
  fields: {
    'System.WorkItemType': 'User Story',
    'System.Title': 'US teste da trava',
    'System.State': 'Active',
    'System.AreaPath': 'Proj\\Area',
    'System.IterationPath': 'Proj\\Sprint 10',
    'System.Tags': 'trava; teleparecer',
    'System.Description': '<div>Descrição</div>',
    'Microsoft.VSTS.Common.AcceptanceCriteria': '<div>AC</div>',
    'System.AssignedTo': { displayName: 'Fulano de Tal', uniqueName: 'fulano@empresa.com', imageUrl: 'https://x/img' },
    'System.CreatedBy': 'Fulano de Tal <fulano@empresa.com>',
  },
  relations: [{ rel: 'Microsoft.VSTS.Common.TestedBy-Forward', url: `https://dev.azure.com/${ORG}/_apis/wit/workItems/200`, attributes: { name: 'Tested By' } }],
  url: `https://dev.azure.com/${ORG}/_apis/wit/workItems/100`,
};

export const stepsXml =
  '<steps id="0" last="2"><step id="1" type="ValidateStep"><parameterizedString isformatted="true">&lt;DIV&gt;Abrir&lt;/DIV&gt;</parameterizedString><parameterizedString isformatted="true">&lt;DIV&gt;Abre&lt;/DIV&gt;</parameterizedString></step><step id="2" type="ValidateStep"><parameterizedString isformatted="true">a</parameterizedString><parameterizedString isformatted="true">b</parameterizedString></step></steps>';

export const testCase = {
  id: 200,
  fields: {
    'System.WorkItemType': 'Test Case',
    'System.Title': '[SAMWEB] CT01 exemplo',
    'System.State': 'Design',
    'System.AreaPath': 'Proj\\Area',
    'System.IterationPath': 'Proj\\Sprint 10',
    'Microsoft.VSTS.Common.Priority': 2,
    'System.Description': 'Cenário:<br>Dado x',
    'Microsoft.VSTS.TCM.Steps': stepsXml,
  },
  relations: [{ rel: 'Microsoft.VSTS.Common.TestedBy-Reverse', url: `https://dev.azure.com/${ORG}/_apis/wit/workItems/100`, attributes: { name: 'Tests' } }],
};

export const plan = { id: 7, name: 'Plano 2026', state: 'Active', areaPath: 'Proj\\Area', iteration: 'Proj\\Sprint 10', rootSuite: { id: 1, name: 'Plano 2026' } };

export const suitesTree = [
  {
    id: 1,
    name: 'Plano 2026',
    suiteType: 'staticTestSuite',
    hasChildren: true,
    children: [
      {
        id: 2,
        name: 'Sprint 10',
        suiteType: 'staticTestSuite',
        parentSuite: { id: 1 },
        hasChildren: true,
        children: [{ id: 3, name: '100 - US teste da trava', suiteType: 'requirementTestSuite', requirementId: 100, parentSuite: { id: 2 } }],
      },
    ],
  },
];

export const routes: Record<string, unknown> = {
  'project:wit/workitems/100': workItem,
  'project:wit/workitems/200': testCase,
  'organization:wit/workitemrelationtypes': { count: 1, value: [{ referenceName: 'Microsoft.VSTS.Common.TestedBy-Reverse', name: 'Tests' }] },
  'project:testplan/plans': { count: 1, value: [plan] },
  'project:testplan/plans/7': plan,
  'project:testplan/Plans/7/suites': { value: suitesTree },
  'project:testplan/Plans/7/Suites/3/TestCase': { value: [{ workItem: { id: 200, name: 'CT01' } }] },
  'organization:testplan/suites': { value: [{ id: 3, name: '100 - US teste da trava', suiteType: 'requirementTestSuite', requirementId: 100 }] },
  'project:wit/workitemtypes/Test%20Case/fields': { value: [{ referenceName: 'System.Title', name: 'Title', alwaysRequired: true }, { referenceName: 'System.Description', name: 'Description', alwaysRequired: false }] },
};

export interface Call {
  method: string | undefined;
  url: string;
  auth: string | null;
}

/** fetch falso: registra chamadas e responde por rota; rotas ausentes dão 404. */
export function makeFetch(overrides: Record<string, unknown> = {}, calls: Call[] = []): typeof fetch {
  const table = { ...routes, ...overrides };
  return (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    const headers = new Headers(init?.headers);
    calls.push({ method: init?.method, url, auth: headers.get('authorization') });
    const u = new URL(url);
    const parts = u.pathname.split('/').filter(Boolean); // [org, (project), _apis, ...]
    const apiIdx = parts.indexOf('_apis');
    const scope = apiIdx === 1 ? 'organization' : 'project';
    const key = `${scope}:${parts.slice(apiIdx + 1).join('/')}`;
    if (table[key] === undefined) return new Response('not found', { status: 404 });
    return new Response(JSON.stringify(table[key]), { status: 200, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;
}
