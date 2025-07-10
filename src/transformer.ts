import { Node } from 'estree';
import { booleanOptimizationPlugin, constantFoldingPlugin, deadCodeEliminationPlugin } from './plugins/compression';
// import { manglePlugin } from './plugins/mangle';
import { ScopeManagerImpl } from './scope';
import { traverse } from './traverser';
import { MinifyOptions, TransformationContext, TransformerPlugin } from './types';

/**
 * 转换引擎
 * 负责协调各个转换插件的执行
 */
export class TransformEngine {
    private options: MinifyOptions;
    private plugins: TransformerPlugin[] = [];

    constructor(options: MinifyOptions = {}) {
        this.options = options;
        this.setupPlugins();
    }

    /**
     * 转换 AST
     */
    transform(ast: Node): Node {
        // 第一步：作用域分析
        const scopeManager = new ScopeManagerImpl();
        scopeManager.analyze(ast);

        // 第二步：应用转换插件
        const context: TransformationContext = {
            scopeManager,
            options: this.options,
        };

        // 执行所有插件
        this.plugins.forEach(plugin => {
            const visitor = plugin(context);
            if (visitor && Object.keys(visitor).length > 0) {
                traverse(ast, visitor);
            }
        });

        return ast;
    }

    /**
     * 设置插件
     */
    private setupPlugins(): void {
        const { compress, mangle } = this.options;

        // 压缩插件
        if (compress?.constantFolding !== false) {
            this.plugins.push(constantFoldingPlugin);
        }

        if (compress?.booleanOptimization !== false) {
            this.plugins.push(booleanOptimizationPlugin);
        }

        if (compress?.deadCodeElimination !== false) {
            this.plugins.push(deadCodeEliminationPlugin);
        }

        // 混淆插件（应该在最后执行）
        // TODO: 修复混淆插件的类型问题
        // if (mangle?.enabled) {
        //   this.plugins.push(manglePlugin);
        // }
    }

    /**
     * 添加自定义插件
     */
    addPlugin(plugin: TransformerPlugin): void {
        this.plugins.push(plugin);
    }

    /**
     * 移除插件
     */
    removePlugin(plugin: TransformerPlugin): void {
        const index = this.plugins.indexOf(plugin);
        if (index > -1) {
            this.plugins.splice(index, 1);
        }
    }

    /**
     * 更新选项
     */
    updateOptions(options: Partial<MinifyOptions>): void {
        this.options = { ...this.options, ...options };
        this.plugins = [];
        this.setupPlugins();
    }
}
