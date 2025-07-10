import { ArrowFunctionExpression, BlockStatement, ClassDeclaration, FunctionDeclaration, FunctionExpression, Identifier, Node, VariableDeclarator } from 'estree';
import { traverse } from './traverser';
import { Binding, Scope, ScopeManager } from './types';

/**
 * 作用域实现
 */
export class ScopeImpl implements Scope {
    public id: number;
    public parent: Scope | null;
    public bindings: Map<string, Binding> = new Map();
    public children: Scope[] = [];
    public type: 'global' | 'function' | 'block' | 'class';
    public node: Node | null;

    private static nextId = 0;

    constructor(type: Scope['type'], parent: Scope | null, node: Node | null = null) {
        this.id = ScopeImpl.nextId++;
        this.type = type;
        this.parent = parent;
        this.node = node;

        if (parent) {
            parent.children.push(this);
        }
    }

    /**
     * 查找变量定义的作用域
     */
    findDefiningScope(name: string): Scope | null {
        if (this.bindings.has(name)) {
            return this;
        }

        if (this.parent) {
            return this.parent.findDefiningScope(name);
        }

        return null;
    }

    /**
     * 添加变量绑定
     */
    addBinding(name: string, declarationNode: Node): void {
        if (!this.bindings.has(name)) {
            this.bindings.set(name, {
                name,
                declaration: declarationNode,
                references: [],
                reassigned: false,
                isConstant: false,
                mangledName: null,
            });
        }
    }

    /**
     * 添加变量引用
     */
    addReference(name: string, referenceNode: Node): void {
        const definingScope = this.findDefiningScope(name);
        if (definingScope) {
            const binding = definingScope.bindings.get(name);
            if (binding) {
                binding.references.push(referenceNode);
            }
        }
    }

    /**
     * 标记变量为重新赋值
     */
    markReassigned(name: string): void {
        const definingScope = this.findDefiningScope(name);
        if (definingScope) {
            const binding = definingScope.bindings.get(name);
            if (binding) {
                binding.reassigned = true;
            }
        }
    }
}

/**
 * 作用域管理器实现
 */
export class ScopeManagerImpl implements ScopeManager {
    public globalScope: Scope;
    public scopes: Scope[] = [];
    public scopeStack: Scope[] = [];
    public currentScope: Scope;

    constructor() {
        this.globalScope = new ScopeImpl('global', null);
        this.scopes.push(this.globalScope);
        this.currentScope = this.globalScope;
        this.scopeStack.push(this.globalScope);
    }

    /**
     * 分析 AST 并构建作用域树
     */
    analyze(ast: Node): void {
        traverse(ast, {
            // 处理函数声明
            FunctionDeclaration: {
                enter: (node: Node) => {
                    const funcNode = node as FunctionDeclaration;
                    // 在当前作用域添加函数名绑定
                    if (funcNode.id) {
                        this.addBinding(funcNode.id.name, funcNode);
                    }

                    // 创建函数作用域
                    const functionScope = this.createScope('function', funcNode);
                    this.enterScope(functionScope);

                    // 添加参数绑定
                    funcNode.params.forEach(param => {
                        if (param.type === 'Identifier') {
                            this.addBinding(param.name, param);
                        }
                    });
                },
                exit: () => {
                    this.exitScope();
                }
            },

            // 处理函数表达式
            FunctionExpression: {
                enter: (node: Node) => {
                    const funcNode = node as FunctionExpression;
                    const functionScope = this.createScope('function', funcNode);
                    this.enterScope(functionScope);

                    // 如果有函数名，添加到函数作用域内
                    if (funcNode.id) {
                        this.addBinding(funcNode.id.name, funcNode);
                    }

                    // 添加参数绑定
                    funcNode.params.forEach(param => {
                        if (param.type === 'Identifier') {
                            this.addBinding(param.name, param);
                        }
                    });
                },
                exit: () => {
                    this.exitScope();
                }
            },

            // 处理箭头函数
            ArrowFunctionExpression: {
                enter: (node: Node) => {
                    const funcNode = node as ArrowFunctionExpression;
                    const functionScope = this.createScope('function', funcNode);
                    this.enterScope(functionScope);

                    // 添加参数绑定
                    funcNode.params.forEach(param => {
                        if (param.type === 'Identifier') {
                            this.addBinding(param.name, param);
                        }
                    });
                },
                exit: () => {
                    this.exitScope();
                }
            },

            // 处理块语句
            BlockStatement: {
                enter: (node: Node) => {
                    const blockNode = node as BlockStatement;
                    // 只有在不是函数体的情况下才创建块作用域
                    if (!this.isDirectFunctionBody(blockNode)) {
                        const blockScope = this.createScope('block', blockNode);
                        this.enterScope(blockScope);
                    }
                },
                exit: (node: Node) => {
                    const blockNode = node as BlockStatement;
                    if (!this.isDirectFunctionBody(blockNode)) {
                        this.exitScope();
                    }
                }
            },

            // 处理类声明
            ClassDeclaration: {
                enter: (node: Node) => {
                    const classNode = node as ClassDeclaration;
                    if (classNode.id) {
                        this.addBinding(classNode.id.name, classNode);
                    }

                    const classScope = this.createScope('class', classNode);
                    this.enterScope(classScope);
                },
                exit: () => {
                    this.exitScope();
                }
            },

            // 处理变量声明
            VariableDeclarator: (node: Node) => {
                const varNode = node as VariableDeclarator;
                if (varNode.id.type === 'Identifier') {
                    this.addBinding(varNode.id.name, varNode);
                }
            },

            // 处理标识符引用
            Identifier: (node: Node, parent: Node | null) => {
                const idNode = node as Identifier;
                // 跳过声明中的标识符
                if (this.isDeclarationIdentifier(idNode, parent)) {
                    return;
                }

                // 添加引用
                this.currentScope.addReference(idNode.name, idNode);
            },

            // 处理赋值表达式
            AssignmentExpression: (node: Node) => {
                const assignNode = node as any;
                if (assignNode.left.type === 'Identifier') {
                    this.currentScope.markReassigned(assignNode.left.name);
                }
            },

            // 处理更新表达式 (++, --)
            UpdateExpression: (node: Node) => {
                const updateNode = node as any;
                if (updateNode.argument.type === 'Identifier') {
                    this.currentScope.markReassigned(updateNode.argument.name);
                }
            }
        });
    }

    /**
     * 创建新作用域
     */
    createScope(type: Scope['type'], node: Node | null): Scope {
        const scope = new ScopeImpl(type, this.currentScope, node);
        this.scopes.push(scope);
        return scope;
    }

    /**
     * 进入作用域
     */
    enterScope(scope: Scope): void {
        this.scopeStack.push(scope);
        this.currentScope = scope;
    }

    /**
     * 退出作用域
     */
    exitScope(): void {
        this.scopeStack.pop();
        this.currentScope = this.scopeStack[this.scopeStack.length - 1];
    }

    /**
     * 添加变量绑定
     */
    addBinding(name: string, declarationNode: Node): void {
        this.currentScope.addBinding(name, declarationNode);
    }

    /**
     * 查找变量定义的作用域
     */
    findDefiningScope(name: string): Scope | null {
        return this.currentScope.findDefiningScope(name);
    }

    /**
     * 检查是否是声明中的标识符
     */
    private isDeclarationIdentifier(node: Identifier, parent: Node | null): boolean {
        if (!parent) return false;

        return (
            (parent.type === 'VariableDeclarator' && parent.id === node) ||
            (parent.type === 'FunctionDeclaration' && parent.id === node) ||
            (parent.type === 'ClassDeclaration' && parent.id === node) ||
            (parent.type === 'Property' && parent.key === node && !parent.computed) ||
            (parent.type === 'MethodDefinition' && parent.key === node && !parent.computed)
        );
    }

    /**
     * 检查块语句是否是函数的直接体
     */
    private isDirectFunctionBody(node: BlockStatement): boolean {
        // 检查当前作用域是否是函数作用域且该块是函数体
        if (this.currentScope.type !== 'function' || !this.currentScope.node) {
            return false;
        }

        const functionBody = this.getFunctionBody(this.currentScope.node);
        return functionBody === node;
    }

    /**
     * 获取函数的函数体
     */
    private getFunctionBody(node: Node): BlockStatement | null {
        if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') {
            return node.body;
        }
        if (node.type === 'ArrowFunctionExpression' && node.body.type === 'BlockStatement') {
            return node.body;
        }
        return null;
    }
}
