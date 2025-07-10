import { Identifier, Node } from 'estree';
import { MangleOptions, TransformationContext, TransformerPlugin } from '../types';

/**
 * 变量名混淆插件
 * 将局部变量名替换为更短的名称
 */
export const manglePlugin: TransformerPlugin = (context: TransformationContext) => {
    const options = context.options.mangle || {};

    if (!options.enabled) {
        return {
            // 空的访问者对象
        };
    }

    // 生成混淆名称
    const nameGenerator = new NameGenerator(options);

    // 第一遍：为每个作用域的变量生成混淆名称
    context.scopeManager.scopes.forEach(scope => {
        if (scope.type === 'global') {
            return; // 不混淆全局变量
        }

        nameGenerator.resetForScope();

        scope.bindings.forEach((binding, name) => {
            // 检查是否应该混淆此变量
            if (shouldMangle(name, binding, options)) {
                binding.mangledName = nameGenerator.generateName();
            }
        });
    });

    // 第二遍：替换所有标识符
    return {
        Identifier: (node: Node) => {
            const identifier = node as Identifier;

            // 查找此标识符的绑定
            const definingScope = context.scopeManager.globalScope.findDefiningScope(identifier.name);
            if (definingScope) {
                const binding = definingScope.bindings.get(identifier.name);
                if (binding && binding.mangledName) {
                    identifier.name = binding.mangledName;
                }
            }
        }
    };
};

/**
 * 检查是否应该混淆此变量
 */
function shouldMangle(name: string, binding: any, options: MangleOptions): boolean {
    // 不混淆保留名称
    if (options.reservedNames?.includes(name)) {
        return false;
    }

    // 不混淆类名（如果配置了保留）
    if (options.keepClassNames && isClassName(binding)) {
        return false;
    }

    // 不混淆函数名（如果配置了保留）
    if (options.keepFunctionNames && isFunctionName(binding)) {
        return false;
    }

    // 不混淆已经很短的名称
    if (name.length === 1) {
        return false;
    }

    return true;
}

/**
 * 检查是否是类名
 */
function isClassName(binding: any): boolean {
    return binding.declaration.type === 'ClassDeclaration';
}

/**
 * 检查是否是函数名
 */
function isFunctionName(binding: any): boolean {
    return binding.declaration.type === 'FunctionDeclaration' ||
        binding.declaration.type === 'FunctionExpression';
}

/**
 * 名称生成器
 * 生成短的变量名序列
 */
class NameGenerator {
    private options: MangleOptions;
    private currentIndex: number = 0;

    // 基础字符集（避开关键字和保留字）
    private chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    private nums = '0123456789';

    // JavaScript 关键字和保留字
    private keywords = new Set([
        'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default',
        'delete', 'do', 'else', 'export', 'extends', 'finally', 'for', 'function',
        'if', 'import', 'in', 'instanceof', 'new', 'return', 'super', 'switch',
        'this', 'throw', 'try', 'typeof', 'var', 'void', 'while', 'with', 'yield',
        'let', 'static', 'enum', 'implements', 'package', 'protected', 'interface',
        'private', 'public', 'await', 'abstract', 'boolean', 'byte', 'char', 'double',
        'final', 'float', 'goto', 'int', 'long', 'native', 'short', 'synchronized',
        'throws', 'transient', 'volatile'
    ]);

    constructor(options: MangleOptions) {
        this.options = options;
    }

    /**
     * 为新作用域重置生成器
     */
    resetForScope(): void {
        this.currentIndex = 0;
    }

    /**
     * 生成下一个可用的名称
     */
    generateName(): string {
        let name: string;

        do {
            name = this.indexToName(this.currentIndex);
            this.currentIndex++;
        } while (this.keywords.has(name) || this.options.reservedNames?.includes(name));

        return name;
    }

    /**
     * 将数字索引转换为名称
     */
    private indexToName(index: number): string {
        if (index < this.chars.length) {
            return this.chars[index];
        }

        // 对于更长的名称，使用 base-N 编码
        let result = '';
        let remaining = index - this.chars.length;
        const totalChars = this.chars + this.nums;

        // 第一个字符必须是字母
        result = this.chars[remaining % this.chars.length];
        remaining = Math.floor(remaining / this.chars.length);

        // 后续字符可以是字母或数字
        while (remaining > 0) {
            result += totalChars[remaining % totalChars.length];
            remaining = Math.floor(remaining / totalChars.length);
        }

        return result;
    }
}
