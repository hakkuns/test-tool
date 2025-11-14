import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { scenarioService } from '../services/scenarioService.js';
import {
  createScenarioSchema,
  updateScenarioSchema,
  scenarioExportSchema,
} from '../types/schemas.js';
import { z } from 'zod';

const scenariosRouter = new Hono();

/**
 * シナリオ一覧取得
 * GET /api/scenarios
 */
scenariosRouter.get('/', (c) => {
  try {
    const scenarios = scenarioService.getAllScenarios();
    return c.json({
      success: true,
      data: scenarios,
      count: scenarios.length,
    });
  } catch (error) {
    console.error('Error fetching scenarios:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to fetch scenarios',
      },
      500
    );
  }
});

/**
 * シナリオ詳細取得
 * GET /api/scenarios/:id
 */
scenariosRouter.get('/:id', (c) => {
  try {
    const id = c.req.param('id');
    const scenario = scenarioService.getScenarioById(id);

    if (!scenario) {
      return c.json(
        {
          success: false,
          error: 'Scenario not found',
        },
        404
      );
    }

    return c.json({
      success: true,
      data: scenario,
    });
  } catch (error) {
    console.error('Error fetching scenario:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to fetch scenario',
      },
      500
    );
  }
});

/**
 * シナリオ作成
 * POST /api/scenarios
 */
scenariosRouter.post(
  '/',
  zValidator('json', createScenarioSchema),
  async (c) => {
    try {
      const data = c.req.valid('json');
      const scenario = scenarioService.createScenario(data);

      return c.json(
        {
          success: true,
          data: scenario,
        },
        201
      );
    } catch (error) {
      console.error('Error creating scenario:', error);
      return c.json(
        {
          success: false,
          error: 'Failed to create scenario',
        },
        500
      );
    }
  }
);

/**
 * シナリオ更新
 * PUT /api/scenarios/:id
 */
scenariosRouter.put(
  '/:id',
  zValidator('json', updateScenarioSchema),
  async (c) => {
    try {
      const id = c.req.param('id');
      const data = c.req.valid('json');
      const scenario = scenarioService.updateScenario(id, data);

      if (!scenario) {
        return c.json(
          {
            success: false,
            error: 'Scenario not found',
          },
          404
        );
      }

      return c.json({
        success: true,
        data: scenario,
      });
    } catch (error) {
      console.error('Error updating scenario:', error);
      return c.json(
        {
          success: false,
          error: 'Failed to update scenario',
        },
        500
      );
    }
  }
);

/**
 * シナリオ削除
 * DELETE /api/scenarios/:id
 */
scenariosRouter.delete('/:id', (c) => {
  try {
    const id = c.req.param('id');
    const deleted = scenarioService.deleteScenario(id);

    if (!deleted) {
      return c.json(
        {
          success: false,
          error: 'Scenario not found',
        },
        404
      );
    }

    return c.json({
      success: true,
      message: 'Scenario deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting scenario:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to delete scenario',
      },
      500
    );
  }
});

/**
 * 個別シナリオエクスポート
 * GET /api/scenarios/:id/export
 */
scenariosRouter.get('/:id/export', (c) => {
  try {
    const id = c.req.param('id');
    const exportData = scenarioService.exportScenario(id);

    if (!exportData) {
      return c.json(
        {
          success: false,
          error: 'Scenario not found',
        },
        404
      );
    }

    return c.json(exportData);
  } catch (error) {
    console.error('Error exporting scenario:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to export scenario',
      },
      500
    );
  }
});

/**
 * 全シナリオエクスポート
 * GET /api/scenarios/export/all
 */
scenariosRouter.get('/export/all', (c) => {
  try {
    const exportData = scenarioService.exportAllScenarios();
    return c.json({
      success: true,
      data: exportData,
      count: exportData.length,
    });
  } catch (error) {
    console.error('Error exporting all scenarios:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to export scenarios',
      },
      500
    );
  }
});

/**
 * シナリオインポート
 * POST /api/scenarios/import
 */
scenariosRouter.post(
  '/import',
  zValidator(
    'json',
    z.union([scenarioExportSchema, z.array(scenarioExportSchema)])
  ),
  async (c) => {
    try {
      const data = c.req.valid('json');

      if (Array.isArray(data)) {
        // 複数シナリオのインポート
        const scenarios = scenarioService.importAllScenarios(data);
        return c.json({
          success: true,
          data: scenarios,
          count: scenarios.length,
        });
      } else {
        // 単一シナリオのインポート
        const scenario = scenarioService.importScenario(data);
        return c.json({
          success: true,
          data: scenario,
        });
      }
    } catch (error) {
      console.error('Error importing scenario:', error);
      return c.json(
        {
          success: false,
          error: 'Failed to import scenario',
        },
        500
      );
    }
  }
);

/**
 * シナリオ適用（環境セットアップ）
 * POST /api/scenarios/:id/apply
 */
scenariosRouter.post('/:id/apply', async (c) => {
  try {
    const id = c.req.param('id');
    const result = await scenarioService.applyScenario(id);

    return c.json({
      success: true,
      data: result,
      message: 'Scenario applied successfully',
    });
  } catch (error) {
    console.error('Error applying scenario:', error);
    return c.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to apply scenario',
      },
      500
    );
  }
});

/**
 * タグ検索
 * GET /api/scenarios/search?tags=tag1,tag2
 */
scenariosRouter.get('/search', (c) => {
  try {
    const tagsParam = c.req.query('tags');
    if (!tagsParam) {
      return c.json(
        {
          success: false,
          error: 'Tags parameter is required',
        },
        400
      );
    }

    const tags = tagsParam.split(',').map((tag) => tag.trim());
    const scenarios = scenarioService.searchByTags(tags);

    return c.json({
      success: true,
      data: scenarios,
      count: scenarios.length,
    });
  } catch (error) {
    console.error('Error searching scenarios:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to search scenarios',
      },
      500
    );
  }
});

export { scenariosRouter };
