"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// build/di/hooks.js
var require_hooks = __commonJS({
  "build/di/hooks.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.registerInitializationHook = registerInitializationHook;
    exports2.getInitializationHooks = getInitializationHooks;
    var initializationHooksKey = /* @__PURE__ */ Symbol("diInitializationHooks");
    function registerInitializationHook(target, hook) {
      const hookableTarget = target;
      if (hookableTarget[initializationHooksKey]) {
        hookableTarget[initializationHooksKey].push(hook);
        return;
      }
      Object.defineProperty(hookableTarget, initializationHooksKey, {
        value: [hook],
        writable: false,
        configurable: false,
        enumerable: false
      });
    }
    __name(registerInitializationHook, "registerInitializationHook");
    function getInitializationHooks(target) {
      return target[initializationHooksKey] ?? [];
    }
    __name(getInitializationHooks, "getInitializationHooks");
  }
});

// build/di/container.js
var require_container = __commonJS({
  "build/di/container.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.createContainer = createContainer;
    var hooks_js_1 = require_hooks();
    function describeToken(token) {
      if (typeof token === "function") {
        return token.name || "<anonymous class>";
      }
      return token.description ?? token.toString();
    }
    __name(describeToken, "describeToken");
    function mergeProviders(modules) {
      const merged = /* @__PURE__ */ new Map();
      const moduleList = Array.isArray(modules) ? modules : [modules];
      for (const moduleMetadata of moduleList) {
        for (const [token, definition] of moduleMetadata.providers) {
          if (merged.has(token)) {
            throw new Error(`Token ${describeToken(token)} registered multiple times across modules`);
          }
          merged.set(token, definition);
        }
      }
      return merged;
    }
    __name(mergeProviders, "mergeProviders");
    function createContainer(modules, options = {}) {
      const mergedProviders = mergeProviders(modules);
      const overrides = new Map(options.overrides ?? []);
      const singletons = /* @__PURE__ */ new Map();
      const resolutionStack = [];
      const resolve = /* @__PURE__ */ __name((token) => {
        if (overrides.has(token)) {
          return overrides.get(token);
        }
        if (singletons.has(token)) {
          return singletons.get(token);
        }
        const provider = mergedProviders.get(token);
        if (!provider) {
          throw new Error(`No provider found for ${describeToken(token)}`);
        }
        if (resolutionStack.includes(token)) {
          const cycle = [...resolutionStack, token].map(describeToken).join(" -> ");
          throw new Error(`Circular dependency detected: ${cycle}`);
        }
        resolutionStack.push(token);
        try {
          const dependencies = provider.inject.map((dependencyToken) => resolve(dependencyToken));
          const instance = provider.create(...dependencies);
          if (typeof token === "function") {
            const hooks = (0, hooks_js_1.getInitializationHooks)(token);
            for (const hook of hooks) {
              hook({
                instance,
                token,
                dependencies,
                resolve
              });
            }
          }
          if (provider.scope === "singleton") {
            singletons.set(token, instance);
          }
          return instance;
        } finally {
          resolutionStack.pop();
        }
      }, "resolve");
      return { resolve };
    }
    __name(createContainer, "createContainer");
  }
});

// build/di/inject.js
var require_inject = __commonJS({
  "build/di/inject.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.inject = inject;
    exports2.getInjectMetadata = getInjectMetadata;
    function isInjectFunction(func) {
      return "__injectMetadata__" in func;
    }
    __name(isInjectFunction, "isInjectFunction");
    function inject(options = {}) {
      return /* @__PURE__ */ __name(function InjectDecorator(target) {
        const injectMetadata = {
          scope: options.scope ?? "singleton",
          inject: options.inject ?? []
        };
        Object.defineProperty(target, "__injectMetadata__", {
          value: injectMetadata,
          enumerable: false,
          configurable: false,
          writable: false
        });
      }, "InjectDecorator");
    }
    __name(inject, "inject");
    function getInjectMetadata(func) {
      if (isInjectFunction(func)) {
        return func.__injectMetadata__;
      }
      return void 0;
    }
    __name(getInjectMetadata, "getInjectMetadata");
  }
});

// build/di/module.js
var require_module = __commonJS({
  "build/di/module.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.module = module2;
    exports2.provideValue = provideValue;
    exports2.provideTestValue = provideTestValue;
    var inject_js_1 = require_inject();
    function describeToken(token) {
      if (typeof token === "function") {
        return token.name || "<anonymous class>";
      }
      return token.description ?? token.toString();
    }
    __name(describeToken, "describeToken");
    function createClassProvider(ctor) {
      const injectMetadata = (0, inject_js_1.getInjectMetadata)(ctor);
      if (!injectMetadata) {
        throw new Error(`Class ${ctor.name || "<anonymous>"} must be decorated with @inject to be registered`);
      }
      const concreteCtor = ctor;
      return {
        token: ctor,
        scope: injectMetadata.scope,
        inject: [...injectMetadata.inject],
        create: /* @__PURE__ */ __name((...deps) => new concreteCtor(...deps), "create")
      };
    }
    __name(createClassProvider, "createClassProvider");
    function createFactoryProvider(entry) {
      return {
        token: entry.token,
        scope: entry.scope ?? "singleton",
        inject: entry.inject ? [...entry.inject] : [],
        create: /* @__PURE__ */ __name((...deps) => entry.useFactory(...deps), "create")
      };
    }
    __name(createFactoryProvider, "createFactoryProvider");
    function module2(options = {}) {
      const providers = /* @__PURE__ */ new Map();
      if (options.imports) {
        for (const importedModule of options.imports) {
          for (const [token, definition] of importedModule.providers) {
            if (providers.has(token)) {
              throw new Error(`Token ${describeToken(token)} registered multiple times while importing modules`);
            }
            providers.set(token, definition);
          }
        }
      }
      if (options.register) {
        for (const entry of options.register) {
          const provider = typeof entry === "function" ? createClassProvider(entry) : createFactoryProvider(entry);
          if (providers.has(provider.token)) {
            throw new Error(`Token ${describeToken(provider.token)} registered multiple times in module()`);
          }
          providers.set(provider.token, provider);
        }
      }
      return { providers };
    }
    __name(module2, "module");
    function provideValue(token, factory, scope) {
      return scope ? { token, useFactory: factory, scope } : { token, useFactory: factory };
    }
    __name(provideValue, "provideValue");
    function provideTestValue(token, factory, scope) {
      return scope ? { token, useFactory: factory, scope } : { token, useFactory: factory };
    }
    __name(provideTestValue, "provideTestValue");
  }
});

// build/di/runtime/symbols.js
var require_symbols = __commonJS({
  "build/di/runtime/symbols.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.runtimeServiceSymbol = void 0;
    exports2.runtimeServiceSymbol = /* @__PURE__ */ Symbol("runtimeService");
  }
});

// build/di/runtime/decorators.js
var require_decorators = __commonJS({
  "build/di/runtime/decorators.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.runtimeService = runtimeService;
    exports2.isRuntimeServiceConstructor = isRuntimeServiceConstructor;
    var symbols_js_1 = require_symbols();
    function runtimeService() {
      return (target, { kind }) => {
        if (kind !== "class") {
          throw new Error("@runtimeService() can only be applied to classes.");
        }
        Object.defineProperty(target, symbols_js_1.runtimeServiceSymbol, {
          value: true,
          writable: false,
          configurable: false,
          enumerable: false
        });
      };
    }
    __name(runtimeService, "runtimeService");
    function isRuntimeServiceConstructor(target) {
      return Boolean(target[symbols_js_1.runtimeServiceSymbol]);
    }
    __name(isRuntimeServiceConstructor, "isRuntimeServiceConstructor");
  }
});

// build/di/runtime/application.js
var require_application = __commonJS({
  "build/di/runtime/application.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.createRuntimeApplication = createRuntimeApplication;
    var container_js_1 = require_container();
    var decorators_js_1 = require_decorators();
    function collectRuntimeServiceConstructors(modules) {
      const constructors = /* @__PURE__ */ new Set();
      for (const metadata of modules) {
        for (const [token] of metadata.providers) {
          if (typeof token === "function" && (0, decorators_js_1.isRuntimeServiceConstructor)(token)) {
            constructors.add(token);
          }
        }
      }
      return constructors;
    }
    __name(collectRuntimeServiceConstructors, "collectRuntimeServiceConstructors");
    function isLifecycleParticipant(value) {
      return typeof value === "object" && value !== null && (typeof value.onStart === "function" || typeof value.onShutdown === "function");
    }
    __name(isLifecycleParticipant, "isLifecycleParticipant");
    var DefaultRuntimeApplication = class {
      static {
        __name(this, "DefaultRuntimeApplication");
      }
      #container;
      #modules;
      #features;
      #services = [];
      #participants = [];
      #started = false;
      #disposed = false;
      #startPromise;
      #disposePromise;
      constructor(container, modules, features) {
        this.#container = container;
        this.#modules = modules;
        this.#features = features;
      }
      async start() {
        if (this.#startPromise) {
          return this.#startPromise;
        }
        if (this.#disposed) {
          throw new Error("Cannot start a disposed runtime application.");
        }
        this.#startPromise = this.#startInternal();
        return this.#startPromise;
      }
      async #startInternal() {
        if (this.#started) {
          return;
        }
        this.#instantiateRuntimeServices();
        const context = this.#createContext();
        await this.#runFeatures("start", context);
        await this.#runParticipants("onStart", context);
        this.#started = true;
      }
      async dispose() {
        if (this.#disposePromise) {
          return this.#disposePromise;
        }
        this.#disposePromise = this.#disposeInternal();
        return this.#disposePromise;
      }
      resolve(token) {
        return this.#container.resolve(token);
      }
      async #disposeInternal() {
        if (this.#disposed) {
          return;
        }
        if (this.#startPromise) {
          await this.#startPromise;
        }
        if (!this.#started) {
          this.#disposed = true;
          return;
        }
        const context = this.#createContext();
        const participantErrors = await this.#runParticipants("onShutdown", context, true);
        const featureErrors = await this.#runFeatures("shutdown", context, true);
        this.#disposeServices();
        this.#disposeFeatures();
        this.#participants.length = 0;
        this.#services.length = 0;
        this.#disposed = true;
        if (participantErrors.length > 0 || featureErrors.length > 0) {
          const firstError = participantErrors.length > 0 ? participantErrors[0] : featureErrors[0];
          throw this.#normalizeDisposalError(firstError);
        }
      }
      #normalizeDisposalError(error) {
        if (error instanceof Error) {
          return error;
        }
        if (typeof error === "string") {
          return new Error(error);
        }
        if (typeof error === "undefined") {
          return new Error("unknown");
        }
        try {
          const serialized = JSON.stringify(error);
          return new Error(serialized ?? "unknown");
        } catch {
          return new Error("unknown");
        }
      }
      #createContext() {
        const resolve = /* @__PURE__ */ __name((token) => this.#container.resolve(token), "resolve");
        return {
          container: this.#container,
          resolve,
          metadata: {
            services: this.#services
          }
        };
      }
      #instantiateRuntimeServices() {
        if (this.#services.length > 0) {
          return;
        }
        const constructors = collectRuntimeServiceConstructors(this.#modules);
        for (const ctor of constructors) {
          const instance = this.#container.resolve(ctor);
          if (typeof instance !== "object" || instance === null) {
            throw new Error("Runtime services must be class instances.");
          }
          this.#services.push(instance);
          if (isLifecycleParticipant(instance)) {
            this.#participants.push(instance);
          }
        }
      }
      async #runParticipants(method, context, ignoreErrors = false) {
        const errors = [];
        for (const participant of this.#participants) {
          const handler = participant[method];
          if (!handler) {
            continue;
          }
          try {
            await handler.call(participant, context);
          } catch (error) {
            if (!ignoreErrors) {
              throw error;
            }
            errors.push(error);
          }
        }
        return errors;
      }
      async #runFeatures(method, context, ignoreErrors = false) {
        const errors = [];
        for (const feature of this.#features) {
          const handler = feature[method];
          if (!handler) {
            continue;
          }
          try {
            await handler.call(feature, context);
          } catch (error) {
            if (!ignoreErrors) {
              throw error;
            }
            errors.push(error);
          }
        }
        return errors;
      }
      #disposeServices() {
        for (const service of this.#services) {
          if (typeof service.dispose === "function") {
            try {
              service.dispose();
            } catch {
            }
          }
        }
      }
      #disposeFeatures() {
        for (const feature of this.#features) {
          if (typeof feature.dispose === "function") {
            try {
              feature.dispose();
            } catch {
            }
          }
        }
      }
    };
    function createRuntimeApplication(options) {
      const container = (0, container_js_1.createContainer)(options.modules, { overrides: options.overrides });
      return new DefaultRuntimeApplication(container, options.modules, options.features ?? []);
    }
    __name(createRuntimeApplication, "createRuntimeApplication");
  }
});

// build/di/runtime/types.js
var require_types = __commonJS({
  "build/di/runtime/types.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
  }
});

// build/di/runtime/index.js
var require_runtime = __commonJS({
  "build/di/runtime/index.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: /* @__PURE__ */ __name(function() {
          return m[k];
        }, "get") };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports2 && exports2.__exportStar || function(m, exports3) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p)) __createBinding(exports3, m, p);
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    __exportStar(require_application(), exports2);
    __exportStar(require_decorators(), exports2);
    __exportStar(require_types(), exports2);
  }
});

// build/di/tokens.js
var require_tokens = __commonJS({
  "build/di/tokens.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.createToken = createToken;
    function createToken(description) {
      return Symbol(description);
    }
    __name(createToken, "createToken");
  }
});

// build/di/types.js
var require_types2 = __commonJS({
  "build/di/types.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
  }
});

// build/di/index.js
var require_di = __commonJS({
  "build/di/index.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: /* @__PURE__ */ __name(function() {
          return m[k];
        }, "get") };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports2 && exports2.__exportStar || function(m, exports3) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p)) __createBinding(exports3, m, p);
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    __exportStar(require_container(), exports2);
    __exportStar(require_hooks(), exports2);
    __exportStar(require_inject(), exports2);
    __exportStar(require_module(), exports2);
    __exportStar(require_runtime(), exports2);
    __exportStar(require_tokens(), exports2);
    __exportStar(require_types2(), exports2);
  }
});

// build/server/tokens.js
var require_tokens2 = __commonJS({
  "build/server/tokens.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.WorkspaceStylelintServiceFactoryToken = exports2.lspConnectionToken = exports2.textDocumentsToken = exports2.NormalizeFsPathToken = exports2.PathIsInsideToken = exports2.UriModuleToken = exports2.ReadlineModuleToken = exports2.ChildProcessModuleToken = exports2.OsModuleToken = exports2.PathModuleToken = exports2.FsPromisesModuleToken = void 0;
    var tokens_js_1 = require_tokens();
    exports2.FsPromisesModuleToken = (0, tokens_js_1.createToken)("FileSystem");
    exports2.PathModuleToken = (0, tokens_js_1.createToken)("PathModule");
    exports2.OsModuleToken = (0, tokens_js_1.createToken)("OsModule");
    exports2.ChildProcessModuleToken = (0, tokens_js_1.createToken)("ChildProcessModule");
    exports2.ReadlineModuleToken = (0, tokens_js_1.createToken)("ReadlineModule");
    exports2.UriModuleToken = (0, tokens_js_1.createToken)("UriModule");
    exports2.PathIsInsideToken = (0, tokens_js_1.createToken)("PathIsInside");
    exports2.NormalizeFsPathToken = (0, tokens_js_1.createToken)("NormalizeFsPath");
    exports2.textDocumentsToken = (0, tokens_js_1.createToken)("TextDocuments");
    exports2.lspConnectionToken = (0, tokens_js_1.createToken)("LspConnection");
    exports2.WorkspaceStylelintServiceFactoryToken = (0, tokens_js_1.createToken)("WorkspaceStylelintServiceFactory");
  }
});

// build/server/services/infrastructure/logging.service.js
var require_logging_service = __commonJS({
  "build/server/services/infrastructure/logging.service.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.loggingServiceToken = void 0;
    var index_js_1 = require_di();
    exports2.loggingServiceToken = (0, index_js_1.createToken)("LoggingService");
  }
});

// build/server/services/stylelint-runtime/process-runner.service.js
var require_process_runner_service = __commonJS({
  "build/server/services/stylelint-runtime/process-runner.service.js"(exports2) {
    "use strict";
    var __esDecorate = exports2 && exports2.__esDecorate || function(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
      function accept(f) {
        if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected");
        return f;
      }
      __name(accept, "accept");
      var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
      var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
      var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
      var _, done = false;
      for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function(f) {
          if (done) throw new TypeError("Cannot add initializers after decoration has completed");
          extraInitializers.push(accept(f || null));
        };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
          if (result === void 0) continue;
          if (result === null || typeof result !== "object") throw new TypeError("Object expected");
          if (_ = accept(result.get)) descriptor.get = _;
          if (_ = accept(result.set)) descriptor.set = _;
          if (_ = accept(result.init)) initializers.unshift(_);
        } else if (_ = accept(result)) {
          if (kind === "field") initializers.unshift(_);
          else descriptor[key] = _;
        }
      }
      if (target) Object.defineProperty(target, contextIn.name, descriptor);
      done = true;
    };
    var __runInitializers = exports2 && exports2.__runInitializers || function(thisArg, initializers, value) {
      var useValue = arguments.length > 2;
      for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
      }
      return useValue ? value : void 0;
    };
    var __importDefault2 = exports2 && exports2.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ProcessRunnerService = void 0;
    var node_child_process_1 = __importDefault2(require("node:child_process"));
    var node_readline_1 = __importDefault2(require("node:readline"));
    var index_js_1 = require_di();
    var tokens_js_1 = require_tokens2();
    var ProcessRunnerService = (() => {
      let _classDecorators = [(0, index_js_1.inject)({
        inject: [tokens_js_1.ChildProcessModuleToken, tokens_js_1.ReadlineModuleToken]
      })];
      let _classDescriptor;
      let _classExtraInitializers = [];
      let _classThis;
      var ProcessRunnerService2 = class {
        static {
          __name(this, "ProcessRunnerService");
        }
        static {
          _classThis = this;
        }
        static {
          const _metadata = typeof Symbol === "function" && Symbol.metadata ? /* @__PURE__ */ Object.create(null) : void 0;
          __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
          ProcessRunnerService2 = _classThis = _classDescriptor.value;
          if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
          __runInitializers(_classThis, _classExtraInitializers);
        }
        #childProcess;
        #readline;
        constructor(childProcessModule, readlineModule) {
          this.#childProcess = childProcessModule ?? node_child_process_1.default;
          this.#readline = readlineModule ?? node_readline_1.default;
        }
        /**
         * Runs a process and returns the output as read by the given matcher. The
         * matcher is called for each line of the output with the line. The promise
         * returned by this function is resolved to the first value returned by the
         * matcher once the process has exited.
         *
         * If the matcher returns `undefined`, the line is ignored.
         *
         * If the matcher never returns a value, the promise is resolved to `undefined`.
         *
         * If the matcher throws an error, the promise is rejected with the error and
         * an attempt is made to kill the process.
         *
         * If the process exits with a non-zero exit code or if the child process API
         * emits an error, the promise is rejected with the exit code or error.
         * @param command Shell command or path to executable
         * @param args Arguments to pass to the command
         * @param options Options to pass to the spawner
         * @param matcher Function to match the output line
         */
        async runFindLine(command, args, options, matcher) {
          return await new Promise((resolve, reject) => {
            const childProcess = this.#childProcess.spawn(command, args, options);
            const stdoutReader = this.#readline.createInterface({ input: childProcess.stdout });
            let returnValue;
            let exitCode;
            let resolved = false;
            let streamClosed = false;
            const resolveOrRejectIfNeeded = /* @__PURE__ */ __name(() => {
              if (resolved || exitCode === void 0 || !streamClosed) {
                return;
              }
              resolved = true;
              if (exitCode === 0) {
                resolve(returnValue);
              } else {
                reject(new Error(`Command "${command}" exited with code ${exitCode}.`));
              }
            }, "resolveOrRejectIfNeeded");
            const handleError = /* @__PURE__ */ __name((error) => {
              resolved = true;
              childProcess.removeAllListeners();
              stdoutReader.close();
              try {
                childProcess.kill();
              } catch {
              }
              reject(error);
            }, "handleError");
            stdoutReader.on("line", (line) => {
              if (resolved || returnValue !== void 0) {
                return;
              }
              try {
                const matched = matcher(line);
                if (matched !== void 0) {
                  returnValue = matched;
                }
                resolveOrRejectIfNeeded();
              } catch (error) {
                handleError(error);
              }
            });
            stdoutReader.on("close", () => {
              if (resolved) {
                return;
              }
              streamClosed = true;
              resolveOrRejectIfNeeded();
            });
            childProcess.on("error", handleError);
            childProcess.on("exit", (code, signal) => {
              exitCode = code ?? signal;
              resolveOrRejectIfNeeded();
            });
          });
        }
      };
      return ProcessRunnerService2 = _classThis;
    })();
    exports2.ProcessRunnerService = ProcessRunnerService;
  }
});

// build/server/services/stylelint-runtime/global-path-resolver.service.js
var require_global_path_resolver_service = __commonJS({
  "build/server/services/stylelint-runtime/global-path-resolver.service.js"(exports2) {
    "use strict";
    var __esDecorate = exports2 && exports2.__esDecorate || function(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
      function accept(f) {
        if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected");
        return f;
      }
      __name(accept, "accept");
      var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
      var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
      var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
      var _, done = false;
      for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function(f) {
          if (done) throw new TypeError("Cannot add initializers after decoration has completed");
          extraInitializers.push(accept(f || null));
        };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
          if (result === void 0) continue;
          if (result === null || typeof result !== "object") throw new TypeError("Object expected");
          if (_ = accept(result.get)) descriptor.get = _;
          if (_ = accept(result.set)) descriptor.set = _;
          if (_ = accept(result.init)) initializers.unshift(_);
        } else if (_ = accept(result)) {
          if (kind === "field") initializers.unshift(_);
          else descriptor[key] = _;
        }
      }
      if (target) Object.defineProperty(target, contextIn.name, descriptor);
      done = true;
    };
    var __runInitializers = exports2 && exports2.__runInitializers || function(thisArg, initializers, value) {
      var useValue = arguments.length > 2;
      for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
      }
      return useValue ? value : void 0;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.GlobalPathResolverService = void 0;
    var index_js_1 = require_di();
    var tokens_js_1 = require_tokens2();
    var logging_service_js_1 = require_logging_service();
    var process_runner_service_js_12 = require_process_runner_service();
    var GlobalPathResolverService = (() => {
      let _classDecorators = [(0, index_js_1.inject)({
        inject: [tokens_js_1.OsModuleToken, tokens_js_1.PathModuleToken, process_runner_service_js_12.ProcessRunnerService, logging_service_js_1.loggingServiceToken]
      })];
      let _classDescriptor;
      let _classExtraInitializers = [];
      let _classThis;
      var GlobalPathResolverService2 = class {
        static {
          __name(this, "GlobalPathResolverService");
        }
        static {
          _classThis = this;
        }
        static {
          const _metadata = typeof Symbol === "function" && Symbol.metadata ? /* @__PURE__ */ Object.create(null) : void 0;
          __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
          GlobalPathResolverService2 = _classThis = _classDescriptor.value;
          if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
          __runInitializers(_classThis, _classExtraInitializers);
        }
        /**
         * The logger to use for tracing resolution.
         */
        #logger;
        /**
         * The cache of resolved paths.
         */
        #cache = {
          yarn: void 0,
          npm: void 0,
          pnpm: void 0
        };
        /**
         * Whether or not the current platform is Windows.
         */
        #isWindows;
        /**
         * Path utilities.
         */
        #path;
        /**
         * Runner used to execute package-manager commands.
         */
        #processRunner;
        /**
         * The resolvers by package manager.
         */
        #resolvers = {
          yarn: this.#yarn.bind(this),
          npm: this.#npm.bind(this),
          pnpm: this.#pnpm.bind(this)
        };
        /**
         * Instantiates a new global path resolver.
         */
        constructor(osModule, pathModule, processRunner, loggingService) {
          this.#logger = loggingService.createLogger(GlobalPathResolverService2);
          this.#isWindows = osModule.platform() === "win32";
          this.#path = pathModule;
          this.#processRunner = processRunner;
        }
        /**
         * Resolves the global `node_modules` path for Yarn.
         *
         * Note: Only Yarn 1.x is supported. Yarn 2.x and higher have removed
         * support for globally installed packages.
         */
        async #yarn() {
          const tryParseLog = /* @__PURE__ */ __name((line) => {
            try {
              return JSON.parse(line);
            } catch {
              return void 0;
            }
          }, "tryParseLog");
          const yarnGlobalPath = await this.#processRunner.runFindLine("yarn", ["global", "dir", "--json"], this.#isWindows ? { shell: true } : void 0, (line) => {
            const log = tryParseLog(line);
            if (!log || log.type !== "log" || !log.data) {
              return void 0;
            }
            const globalPath = this.#path.join(log.data, "node_modules");
            this.#logger?.debug("Yarn returned global node_modules path.", {
              path: globalPath
            });
            return globalPath;
          });
          if (!yarnGlobalPath) {
            this.#logger?.warn('"yarn global dir --json" did not return a path.');
            return void 0;
          }
          return yarnGlobalPath;
        }
        /**
         * Resolves the global `node_modules` path for npm.
         */
        async #npm() {
          const npmGlobalPath = await this.#processRunner.runFindLine("npm", ["config", "get", "prefix"], this.#isWindows ? { shell: true } : void 0, (line) => {
            const trimmed = line.trim();
            if (!trimmed) {
              return void 0;
            }
            const globalPath = this.#isWindows ? this.#path.join(trimmed, "node_modules") : this.#path.join(trimmed, "lib/node_modules");
            this.#logger?.debug("npm returned global node_modules path.", {
              path: globalPath
            });
            return globalPath;
          });
          if (!npmGlobalPath) {
            this.#logger?.warn('"npm config get prefix" did not return a path.');
            return void 0;
          }
          return npmGlobalPath;
        }
        /**
         * Resolves the global `node_modules` path for pnpm.
         */
        async #pnpm() {
          const pnpmGlobalPath = await this.#processRunner.runFindLine("pnpm", ["root", "-g"], this.#isWindows ? { shell: true } : void 0, (line) => {
            const trimmed = line.trim();
            if (!trimmed) {
              return void 0;
            }
            this.#logger?.debug("pnpm returned global node_modules path.", {
              path: trimmed
            });
            return trimmed;
          });
          if (!pnpmGlobalPath) {
            this.#logger?.warn('"pnpm root -g" did not return a path.');
            return void 0;
          }
          return pnpmGlobalPath;
        }
        /**
         * Attempts to resolve the global `node_modules` path for the given package
         * manager.
         *
         * On a successful resolution, the method returns a promise that resolves to the
         * package manager's global `node_modules` path. Paths are cached in the
         * resolver on the first successful resolution.
         *
         * When a path cannot be resolved, the promise resolves to `undefined`.
         *
         * @example
         * ```js
         * const resolver = getGlobalPathResolver();
         * const yarnGlobalPath = await resolver.resolve(
         *   'yarn',
         *   message => connection && connection.tracer.log(message)
         * );
         * ```
         * @param packageManager The package manager to resolve the path for.
         */
        async resolve(packageManager) {
          const cached = this.#cache[packageManager];
          if (cached) {
            return cached;
          }
          const resolver = this.#resolvers[packageManager];
          if (!resolver) {
            this.#logger?.warn("Unsupported package manager.", { packageManager });
            return void 0;
          }
          try {
            const globalPath = await resolver();
            if (globalPath) {
              this.#cache[packageManager] = globalPath;
            }
            return globalPath;
          } catch (error) {
            this.#logger?.warn("Failed to resolve global node_modules path.", {
              packageManager,
              error
            });
            return void 0;
          }
        }
      };
      return GlobalPathResolverService2 = _classThis;
    })();
    exports2.GlobalPathResolverService = GlobalPathResolverService;
  }
});

// build/server/services/stylelint-runtime/package-root.service.js
var require_package_root_service = __commonJS({
  "build/server/services/stylelint-runtime/package-root.service.js"(exports2) {
    "use strict";
    var __esDecorate = exports2 && exports2.__esDecorate || function(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
      function accept(f) {
        if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected");
        return f;
      }
      __name(accept, "accept");
      var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
      var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
      var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
      var _, done = false;
      for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function(f) {
          if (done) throw new TypeError("Cannot add initializers after decoration has completed");
          extraInitializers.push(accept(f || null));
        };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
          if (result === void 0) continue;
          if (result === null || typeof result !== "object") throw new TypeError("Object expected");
          if (_ = accept(result.get)) descriptor.get = _;
          if (_ = accept(result.set)) descriptor.set = _;
          if (_ = accept(result.init)) initializers.unshift(_);
        } else if (_ = accept(result)) {
          if (kind === "field") initializers.unshift(_);
          else descriptor[key] = _;
        }
      }
      if (target) Object.defineProperty(target, contextIn.name, descriptor);
      done = true;
    };
    var __runInitializers = exports2 && exports2.__runInitializers || function(thisArg, initializers, value) {
      var useValue = arguments.length > 2;
      for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
      }
      return useValue ? value : void 0;
    };
    var __importDefault2 = exports2 && exports2.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.PackageRootService = void 0;
    var promises_12 = __importDefault2(require("fs/promises"));
    var path_1 = __importDefault2(require("path"));
    var index_js_1 = require_di();
    var tokens_js_1 = require_tokens2();
    var PackageRootService = (() => {
      let _classDecorators = [(0, index_js_1.inject)({
        inject: [tokens_js_1.FsPromisesModuleToken, tokens_js_1.PathModuleToken]
      })];
      let _classDescriptor;
      let _classExtraInitializers = [];
      let _classThis;
      var PackageRootService2 = class {
        static {
          __name(this, "PackageRootService");
        }
        static {
          _classThis = this;
        }
        static {
          const _metadata = typeof Symbol === "function" && Symbol.metadata ? /* @__PURE__ */ Object.create(null) : void 0;
          __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
          PackageRootService2 = _classThis = _classDescriptor.value;
          if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
          __runInitializers(_classThis, _classExtraInitializers);
        }
        #fs;
        #path;
        constructor(fsModule, pathModule) {
          this.#fs = fsModule ?? promises_12.default;
          this.#path = pathModule ?? path_1.default;
        }
        async find(startPath, rootFile = "package.json") {
          let currentDirectory = startPath;
          while (true) {
            const manifestPath = this.#path.join(currentDirectory, rootFile);
            try {
              const stat = await this.#fs.stat(manifestPath);
              if (stat.isFile()) {
                return currentDirectory;
              }
            } catch (error) {
              const code = error.code;
              if (code !== "ENOENT" && code !== "ENOTDIR") {
                throw error;
              }
            }
            const parent = this.#path.dirname(currentDirectory);
            if (!this.#path.relative(parent, currentDirectory)) {
              return void 0;
            }
            currentDirectory = parent;
          }
        }
      };
      return PackageRootService2 = _classThis;
    })();
    exports2.PackageRootService = PackageRootService;
  }
});

// build/server/stylelint/load-stylelint.js
var require_load_stylelint = __commonJS({
  "build/server/stylelint/load-stylelint.js"(exports2) {
    "use strict";
    var __importDefault2 = exports2 && exports2.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.__loadStylelintTestApi = exports2.loadStylelint = void 0;
    var promises_12 = __importDefault2(require("node:fs/promises"));
    var node_path_12 = __importDefault2(require("node:path"));
    var node_url_1 = require("node:url");
    var realDynamicImport = new Function("specifier", '"use strict"; return import(specifier);');
    var dynamicImportImpl = realDynamicImport;
    var getModulePath = /* @__PURE__ */ __name((specifier, requireFn) => {
      if (specifier.startsWith("file://")) {
        return { modulePath: specifier, isResolved: true };
      }
      try {
        return { modulePath: requireFn.resolve(specifier), isResolved: true };
      } catch {
        return { modulePath: specifier, isResolved: false };
      }
    }, "getModulePath");
    var isPathSpecifier = /* @__PURE__ */ __name((value) => value.startsWith("file://") || node_path_12.default.isAbsolute(value) || value.startsWith("./") || value.startsWith("../"), "isPathSpecifier");
    var toFsPath = /* @__PURE__ */ __name((target) => target.startsWith("file://") ? (0, node_url_1.fileURLToPath)(target) : target, "toFsPath");
    var normalizePackageTarget = /* @__PURE__ */ __name((packageRoot, target) => {
      if (target.startsWith("file://")) {
        return target;
      }
      if (node_path_12.default.isAbsolute(target)) {
        return target;
      }
      return node_path_12.default.join(packageRoot, target);
    }, "normalizePackageTarget");
    var resolveExportTarget = /* @__PURE__ */ __name((value) => {
      if (typeof value === "string") {
        return value;
      }
      if (Array.isArray(value)) {
        for (const entry of value) {
          const resolved = resolveExportTarget(entry);
          if (resolved) {
            return resolved;
          }
        }
        return void 0;
      }
      if (value && typeof value === "object") {
        const record = value;
        const priorityKeys = ["import", "module", "default"];
        for (const key of priorityKeys) {
          if (!(key in record)) {
            continue;
          }
          const resolved = resolveExportTarget(record[key]);
          if (resolved) {
            return resolved;
          }
        }
        for (const [key, child] of Object.entries(record)) {
          if (priorityKeys.includes(key) || key === "require" || key === "types") {
            continue;
          }
          const resolved = resolveExportTarget(child);
          if (resolved) {
            return resolved;
          }
        }
      }
      return void 0;
    }, "resolveExportTarget");
    var resolvePreferredEsmEntry = /* @__PURE__ */ __name(async (modulePath, packageRootFinder2) => {
      const packageRoot = await packageRootFinder2.find(node_path_12.default.resolve(toFsPath(modulePath)));
      if (!packageRoot) {
        return void 0;
      }
      try {
        const manifestPath = node_path_12.default.join(packageRoot, "package.json");
        const manifest = JSON.parse(await promises_12.default.readFile(manifestPath, "utf8"));
        const rootExport = typeof manifest.exports === "object" && !Array.isArray(manifest.exports) ? manifest.exports["."] ?? manifest.exports : manifest.exports;
        const exportTarget = resolveExportTarget(rootExport);
        if (exportTarget) {
          return normalizePackageTarget(packageRoot, exportTarget);
        }
        if (typeof manifest.module === "string") {
          return normalizePackageTarget(packageRoot, manifest.module);
        }
      } catch {
        return void 0;
      }
      return void 0;
    }, "resolvePreferredEsmEntry");
    var loadESMStylelint = /* @__PURE__ */ __name(async (target, treatAsPath = true) => {
      const specifier = treatAsPath && !target.startsWith("file://") ? (0, node_url_1.pathToFileURL)(node_path_12.default.resolve(target)).href : target;
      const namespace = await dynamicImportImpl(specifier);
      const stylelint = namespace.default ?? namespace;
      if (!stylelint) {
        throw new Error(`Failed to import Stylelint from ${target}.`);
      }
      return { stylelint, moduleType: "esm" };
    }, "loadESMStylelint");
    var loadStylelint = /* @__PURE__ */ __name(async (packageRootFinder2, specifier, requireFn, resolvedPath) => {
      const { modulePath, isResolved } = resolvedPath ? { modulePath: resolvedPath, isResolved: true } : getModulePath(specifier, requireFn);
      const hasResolvedPath = isResolved || isPathSpecifier(modulePath);
      const preferredEsmEntry = hasResolvedPath ? await resolvePreferredEsmEntry(modulePath, packageRootFinder2) : void 0;
      const seenTargets = /* @__PURE__ */ new Set();
      const importTargets = [];
      const addImportTarget = /* @__PURE__ */ __name((target, treatAsPath) => {
        if (!target) {
          return;
        }
        const key = `${treatAsPath ? "path" : "spec"}:${target}`;
        if (seenTargets.has(key)) {
          return;
        }
        seenTargets.add(key);
        importTargets.push({ target, treatAsPath });
      }, "addImportTarget");
      addImportTarget(preferredEsmEntry, true);
      if (isPathSpecifier(specifier)) {
        addImportTarget(specifier, true);
      }
      const resolvedImportTarget = resolvedPath ?? (hasResolvedPath ? modulePath : void 0);
      addImportTarget(resolvedImportTarget, true);
      let firstImportError;
      for (const { target, treatAsPath } of importTargets) {
        try {
          return await loadESMStylelint(target, treatAsPath);
        } catch (error) {
          if (!firstImportError) {
            firstImportError = error;
          }
        }
      }
      try {
        return {
          stylelint: requireFn(specifier),
          moduleType: "cjs"
        };
      } catch (requireError) {
        if (firstImportError) {
          throw firstImportError;
        }
        throw requireError;
      }
    }, "loadStylelint");
    exports2.loadStylelint = loadStylelint;
    exports2.__loadStylelintTestApi = {
      setDynamicImport(mock) {
        dynamicImportImpl = mock;
      },
      resetDynamicImport() {
        dynamicImportImpl = realDynamicImport;
      }
    };
  }
});

// build/server/worker/types.js
var require_types3 = __commonJS({
  "build/server/worker/types.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.stylelintNotFoundError = void 0;
    exports2.stylelintNotFoundError = "STYLELINT_NOT_FOUND";
  }
});

// node_modules/logform/format.js
var require_format = __commonJS({
  "node_modules/logform/format.js"(exports2, module2) {
    "use strict";
    var InvalidFormatError = class _InvalidFormatError extends Error {
      static {
        __name(this, "InvalidFormatError");
      }
      constructor(formatFn) {
        super(`Format functions must be synchronous taking a two arguments: (info, opts)
Found: ${formatFn.toString().split("\n")[0]}
`);
        Error.captureStackTrace(this, _InvalidFormatError);
      }
    };
    module2.exports = (formatFn) => {
      if (formatFn.length > 2) {
        throw new InvalidFormatError(formatFn);
      }
      function Format(options = {}) {
        this.options = options;
      }
      __name(Format, "Format");
      Format.prototype.transform = formatFn;
      function createFormatWrap(opts) {
        return new Format(opts);
      }
      __name(createFormatWrap, "createFormatWrap");
      createFormatWrap.Format = Format;
      return createFormatWrap;
    };
  }
});

// node_modules/@colors/colors/lib/styles.js
var require_styles = __commonJS({
  "node_modules/@colors/colors/lib/styles.js"(exports2, module2) {
    var styles = {};
    module2["exports"] = styles;
    var codes = {
      reset: [0, 0],
      bold: [1, 22],
      dim: [2, 22],
      italic: [3, 23],
      underline: [4, 24],
      inverse: [7, 27],
      hidden: [8, 28],
      strikethrough: [9, 29],
      black: [30, 39],
      red: [31, 39],
      green: [32, 39],
      yellow: [33, 39],
      blue: [34, 39],
      magenta: [35, 39],
      cyan: [36, 39],
      white: [37, 39],
      gray: [90, 39],
      grey: [90, 39],
      brightRed: [91, 39],
      brightGreen: [92, 39],
      brightYellow: [93, 39],
      brightBlue: [94, 39],
      brightMagenta: [95, 39],
      brightCyan: [96, 39],
      brightWhite: [97, 39],
      bgBlack: [40, 49],
      bgRed: [41, 49],
      bgGreen: [42, 49],
      bgYellow: [43, 49],
      bgBlue: [44, 49],
      bgMagenta: [45, 49],
      bgCyan: [46, 49],
      bgWhite: [47, 49],
      bgGray: [100, 49],
      bgGrey: [100, 49],
      bgBrightRed: [101, 49],
      bgBrightGreen: [102, 49],
      bgBrightYellow: [103, 49],
      bgBrightBlue: [104, 49],
      bgBrightMagenta: [105, 49],
      bgBrightCyan: [106, 49],
      bgBrightWhite: [107, 49],
      // legacy styles for colors pre v1.0.0
      blackBG: [40, 49],
      redBG: [41, 49],
      greenBG: [42, 49],
      yellowBG: [43, 49],
      blueBG: [44, 49],
      magentaBG: [45, 49],
      cyanBG: [46, 49],
      whiteBG: [47, 49]
    };
    Object.keys(codes).forEach(function(key) {
      var val = codes[key];
      var style = styles[key] = [];
      style.open = "\x1B[" + val[0] + "m";
      style.close = "\x1B[" + val[1] + "m";
    });
  }
});

// node_modules/@colors/colors/lib/system/has-flag.js
var require_has_flag = __commonJS({
  "node_modules/@colors/colors/lib/system/has-flag.js"(exports2, module2) {
    "use strict";
    module2.exports = function(flag, argv) {
      argv = argv || process.argv || [];
      var terminatorPos = argv.indexOf("--");
      var prefix = /^-{1,2}/.test(flag) ? "" : "--";
      var pos = argv.indexOf(prefix + flag);
      return pos !== -1 && (terminatorPos === -1 ? true : pos < terminatorPos);
    };
  }
});

// node_modules/@colors/colors/lib/system/supports-colors.js
var require_supports_colors = __commonJS({
  "node_modules/@colors/colors/lib/system/supports-colors.js"(exports2, module2) {
    "use strict";
    var os = require("os");
    var hasFlag = require_has_flag();
    var env = process.env;
    var forceColor = void 0;
    if (hasFlag("no-color") || hasFlag("no-colors") || hasFlag("color=false")) {
      forceColor = false;
    } else if (hasFlag("color") || hasFlag("colors") || hasFlag("color=true") || hasFlag("color=always")) {
      forceColor = true;
    }
    if ("FORCE_COLOR" in env) {
      forceColor = env.FORCE_COLOR.length === 0 || parseInt(env.FORCE_COLOR, 10) !== 0;
    }
    function translateLevel(level) {
      if (level === 0) {
        return false;
      }
      return {
        level,
        hasBasic: true,
        has256: level >= 2,
        has16m: level >= 3
      };
    }
    __name(translateLevel, "translateLevel");
    function supportsColor(stream) {
      if (forceColor === false) {
        return 0;
      }
      if (hasFlag("color=16m") || hasFlag("color=full") || hasFlag("color=truecolor")) {
        return 3;
      }
      if (hasFlag("color=256")) {
        return 2;
      }
      if (stream && !stream.isTTY && forceColor !== true) {
        return 0;
      }
      var min = forceColor ? 1 : 0;
      if (process.platform === "win32") {
        var osRelease = os.release().split(".");
        if (Number(process.versions.node.split(".")[0]) >= 8 && Number(osRelease[0]) >= 10 && Number(osRelease[2]) >= 10586) {
          return Number(osRelease[2]) >= 14931 ? 3 : 2;
        }
        return 1;
      }
      if ("CI" in env) {
        if (["TRAVIS", "CIRCLECI", "APPVEYOR", "GITLAB_CI"].some(function(sign) {
          return sign in env;
        }) || env.CI_NAME === "codeship") {
          return 1;
        }
        return min;
      }
      if ("TEAMCITY_VERSION" in env) {
        return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
      }
      if ("TERM_PROGRAM" in env) {
        var version = parseInt((env.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
        switch (env.TERM_PROGRAM) {
          case "iTerm.app":
            return version >= 3 ? 3 : 2;
          case "Hyper":
            return 3;
          case "Apple_Terminal":
            return 2;
        }
      }
      if (/-256(color)?$/i.test(env.TERM)) {
        return 2;
      }
      if (/^screen|^xterm|^vt100|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) {
        return 1;
      }
      if ("COLORTERM" in env) {
        return 1;
      }
      if (env.TERM === "dumb") {
        return min;
      }
      return min;
    }
    __name(supportsColor, "supportsColor");
    function getSupportLevel(stream) {
      var level = supportsColor(stream);
      return translateLevel(level);
    }
    __name(getSupportLevel, "getSupportLevel");
    module2.exports = {
      supportsColor: getSupportLevel,
      stdout: getSupportLevel(process.stdout),
      stderr: getSupportLevel(process.stderr)
    };
  }
});

// node_modules/@colors/colors/lib/custom/trap.js
var require_trap = __commonJS({
  "node_modules/@colors/colors/lib/custom/trap.js"(exports2, module2) {
    module2["exports"] = /* @__PURE__ */ __name(function runTheTrap(text, options) {
      var result = "";
      text = text || "Run the trap, drop the bass";
      text = text.split("");
      var trap = {
        a: ["@", "\u0104", "\u023A", "\u0245", "\u0394", "\u039B", "\u0414"],
        b: ["\xDF", "\u0181", "\u0243", "\u026E", "\u03B2", "\u0E3F"],
        c: ["\xA9", "\u023B", "\u03FE"],
        d: ["\xD0", "\u018A", "\u0500", "\u0501", "\u0502", "\u0503"],
        e: [
          "\xCB",
          "\u0115",
          "\u018E",
          "\u0258",
          "\u03A3",
          "\u03BE",
          "\u04BC",
          "\u0A6C"
        ],
        f: ["\u04FA"],
        g: ["\u0262"],
        h: ["\u0126", "\u0195", "\u04A2", "\u04BA", "\u04C7", "\u050A"],
        i: ["\u0F0F"],
        j: ["\u0134"],
        k: ["\u0138", "\u04A0", "\u04C3", "\u051E"],
        l: ["\u0139"],
        m: ["\u028D", "\u04CD", "\u04CE", "\u0520", "\u0521", "\u0D69"],
        n: ["\xD1", "\u014B", "\u019D", "\u0376", "\u03A0", "\u048A"],
        o: [
          "\xD8",
          "\xF5",
          "\xF8",
          "\u01FE",
          "\u0298",
          "\u047A",
          "\u05DD",
          "\u06DD",
          "\u0E4F"
        ],
        p: ["\u01F7", "\u048E"],
        q: ["\u09CD"],
        r: ["\xAE", "\u01A6", "\u0210", "\u024C", "\u0280", "\u042F"],
        s: ["\xA7", "\u03DE", "\u03DF", "\u03E8"],
        t: ["\u0141", "\u0166", "\u0373"],
        u: ["\u01B1", "\u054D"],
        v: ["\u05D8"],
        w: ["\u0428", "\u0460", "\u047C", "\u0D70"],
        x: ["\u04B2", "\u04FE", "\u04FC", "\u04FD"],
        y: ["\xA5", "\u04B0", "\u04CB"],
        z: ["\u01B5", "\u0240"]
      };
      text.forEach(function(c) {
        c = c.toLowerCase();
        var chars = trap[c] || [" "];
        var rand = Math.floor(Math.random() * chars.length);
        if (typeof trap[c] !== "undefined") {
          result += trap[c][rand];
        } else {
          result += c;
        }
      });
      return result;
    }, "runTheTrap");
  }
});

// node_modules/@colors/colors/lib/custom/zalgo.js
var require_zalgo = __commonJS({
  "node_modules/@colors/colors/lib/custom/zalgo.js"(exports2, module2) {
    module2["exports"] = /* @__PURE__ */ __name(function zalgo(text, options) {
      text = text || "   he is here   ";
      var soul = {
        "up": [
          "\u030D",
          "\u030E",
          "\u0304",
          "\u0305",
          "\u033F",
          "\u0311",
          "\u0306",
          "\u0310",
          "\u0352",
          "\u0357",
          "\u0351",
          "\u0307",
          "\u0308",
          "\u030A",
          "\u0342",
          "\u0313",
          "\u0308",
          "\u034A",
          "\u034B",
          "\u034C",
          "\u0303",
          "\u0302",
          "\u030C",
          "\u0350",
          "\u0300",
          "\u0301",
          "\u030B",
          "\u030F",
          "\u0312",
          "\u0313",
          "\u0314",
          "\u033D",
          "\u0309",
          "\u0363",
          "\u0364",
          "\u0365",
          "\u0366",
          "\u0367",
          "\u0368",
          "\u0369",
          "\u036A",
          "\u036B",
          "\u036C",
          "\u036D",
          "\u036E",
          "\u036F",
          "\u033E",
          "\u035B",
          "\u0346",
          "\u031A"
        ],
        "down": [
          "\u0316",
          "\u0317",
          "\u0318",
          "\u0319",
          "\u031C",
          "\u031D",
          "\u031E",
          "\u031F",
          "\u0320",
          "\u0324",
          "\u0325",
          "\u0326",
          "\u0329",
          "\u032A",
          "\u032B",
          "\u032C",
          "\u032D",
          "\u032E",
          "\u032F",
          "\u0330",
          "\u0331",
          "\u0332",
          "\u0333",
          "\u0339",
          "\u033A",
          "\u033B",
          "\u033C",
          "\u0345",
          "\u0347",
          "\u0348",
          "\u0349",
          "\u034D",
          "\u034E",
          "\u0353",
          "\u0354",
          "\u0355",
          "\u0356",
          "\u0359",
          "\u035A",
          "\u0323"
        ],
        "mid": [
          "\u0315",
          "\u031B",
          "\u0300",
          "\u0301",
          "\u0358",
          "\u0321",
          "\u0322",
          "\u0327",
          "\u0328",
          "\u0334",
          "\u0335",
          "\u0336",
          "\u035C",
          "\u035D",
          "\u035E",
          "\u035F",
          "\u0360",
          "\u0362",
          "\u0338",
          "\u0337",
          "\u0361",
          " \u0489"
        ]
      };
      var all = [].concat(soul.up, soul.down, soul.mid);
      function randomNumber(range) {
        var r = Math.floor(Math.random() * range);
        return r;
      }
      __name(randomNumber, "randomNumber");
      function isChar(character) {
        var bool = false;
        all.filter(function(i) {
          bool = i === character;
        });
        return bool;
      }
      __name(isChar, "isChar");
      function heComes(text2, options2) {
        var result = "";
        var counts;
        var l;
        options2 = options2 || {};
        options2["up"] = typeof options2["up"] !== "undefined" ? options2["up"] : true;
        options2["mid"] = typeof options2["mid"] !== "undefined" ? options2["mid"] : true;
        options2["down"] = typeof options2["down"] !== "undefined" ? options2["down"] : true;
        options2["size"] = typeof options2["size"] !== "undefined" ? options2["size"] : "maxi";
        text2 = text2.split("");
        for (l in text2) {
          if (isChar(l)) {
            continue;
          }
          result = result + text2[l];
          counts = { "up": 0, "down": 0, "mid": 0 };
          switch (options2.size) {
            case "mini":
              counts.up = randomNumber(8);
              counts.mid = randomNumber(2);
              counts.down = randomNumber(8);
              break;
            case "maxi":
              counts.up = randomNumber(16) + 3;
              counts.mid = randomNumber(4) + 1;
              counts.down = randomNumber(64) + 3;
              break;
            default:
              counts.up = randomNumber(8) + 1;
              counts.mid = randomNumber(6) / 2;
              counts.down = randomNumber(8) + 1;
              break;
          }
          var arr = ["up", "mid", "down"];
          for (var d in arr) {
            var index = arr[d];
            for (var i = 0; i <= counts[index]; i++) {
              if (options2[index]) {
                result = result + soul[index][randomNumber(soul[index].length)];
              }
            }
          }
        }
        return result;
      }
      __name(heComes, "heComes");
      return heComes(text, options);
    }, "zalgo");
  }
});

// node_modules/@colors/colors/lib/maps/america.js
var require_america = __commonJS({
  "node_modules/@colors/colors/lib/maps/america.js"(exports2, module2) {
    module2["exports"] = function(colors) {
      return function(letter, i, exploded) {
        if (letter === " ") return letter;
        switch (i % 3) {
          case 0:
            return colors.red(letter);
          case 1:
            return colors.white(letter);
          case 2:
            return colors.blue(letter);
        }
      };
    };
  }
});

// node_modules/@colors/colors/lib/maps/zebra.js
var require_zebra = __commonJS({
  "node_modules/@colors/colors/lib/maps/zebra.js"(exports2, module2) {
    module2["exports"] = function(colors) {
      return function(letter, i, exploded) {
        return i % 2 === 0 ? letter : colors.inverse(letter);
      };
    };
  }
});

// node_modules/@colors/colors/lib/maps/rainbow.js
var require_rainbow = __commonJS({
  "node_modules/@colors/colors/lib/maps/rainbow.js"(exports2, module2) {
    module2["exports"] = function(colors) {
      var rainbowColors = ["red", "yellow", "green", "blue", "magenta"];
      return function(letter, i, exploded) {
        if (letter === " ") {
          return letter;
        } else {
          return colors[rainbowColors[i++ % rainbowColors.length]](letter);
        }
      };
    };
  }
});

// node_modules/@colors/colors/lib/maps/random.js
var require_random = __commonJS({
  "node_modules/@colors/colors/lib/maps/random.js"(exports2, module2) {
    module2["exports"] = function(colors) {
      var available = [
        "underline",
        "inverse",
        "grey",
        "yellow",
        "red",
        "green",
        "blue",
        "white",
        "cyan",
        "magenta",
        "brightYellow",
        "brightRed",
        "brightGreen",
        "brightBlue",
        "brightWhite",
        "brightCyan",
        "brightMagenta"
      ];
      return function(letter, i, exploded) {
        return letter === " " ? letter : colors[available[Math.round(Math.random() * (available.length - 2))]](letter);
      };
    };
  }
});

// node_modules/@colors/colors/lib/colors.js
var require_colors = __commonJS({
  "node_modules/@colors/colors/lib/colors.js"(exports2, module2) {
    var colors = {};
    module2["exports"] = colors;
    colors.themes = {};
    var util = require("util");
    var ansiStyles = colors.styles = require_styles();
    var defineProps = Object.defineProperties;
    var newLineRegex = new RegExp(/[\r\n]+/g);
    colors.supportsColor = require_supports_colors().supportsColor;
    if (typeof colors.enabled === "undefined") {
      colors.enabled = colors.supportsColor() !== false;
    }
    colors.enable = function() {
      colors.enabled = true;
    };
    colors.disable = function() {
      colors.enabled = false;
    };
    colors.stripColors = colors.strip = function(str) {
      return ("" + str).replace(/\x1B\[\d+m/g, "");
    };
    var stylize = colors.stylize = /* @__PURE__ */ __name(function stylize2(str, style) {
      if (!colors.enabled) {
        return str + "";
      }
      var styleMap = ansiStyles[style];
      if (!styleMap && style in colors) {
        return colors[style](str);
      }
      return styleMap.open + str + styleMap.close;
    }, "stylize");
    var matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;
    var escapeStringRegexp = /* @__PURE__ */ __name(function(str) {
      if (typeof str !== "string") {
        throw new TypeError("Expected a string");
      }
      return str.replace(matchOperatorsRe, "\\$&");
    }, "escapeStringRegexp");
    function build(_styles) {
      var builder = /* @__PURE__ */ __name(function builder2() {
        return applyStyle.apply(builder2, arguments);
      }, "builder");
      builder._styles = _styles;
      builder.__proto__ = proto;
      return builder;
    }
    __name(build, "build");
    var styles = (function() {
      var ret = {};
      ansiStyles.grey = ansiStyles.gray;
      Object.keys(ansiStyles).forEach(function(key) {
        ansiStyles[key].closeRe = new RegExp(escapeStringRegexp(ansiStyles[key].close), "g");
        ret[key] = {
          get: /* @__PURE__ */ __name(function() {
            return build(this._styles.concat(key));
          }, "get")
        };
      });
      return ret;
    })();
    var proto = defineProps(/* @__PURE__ */ __name(function colors2() {
    }, "colors"), styles);
    function applyStyle() {
      var args = Array.prototype.slice.call(arguments);
      var str = args.map(function(arg) {
        if (arg != null && arg.constructor === String) {
          return arg;
        } else {
          return util.inspect(arg);
        }
      }).join(" ");
      if (!colors.enabled || !str) {
        return str;
      }
      var newLinesPresent = str.indexOf("\n") != -1;
      var nestedStyles = this._styles;
      var i = nestedStyles.length;
      while (i--) {
        var code = ansiStyles[nestedStyles[i]];
        str = code.open + str.replace(code.closeRe, code.open) + code.close;
        if (newLinesPresent) {
          str = str.replace(newLineRegex, function(match) {
            return code.close + match + code.open;
          });
        }
      }
      return str;
    }
    __name(applyStyle, "applyStyle");
    colors.setTheme = function(theme) {
      if (typeof theme === "string") {
        console.log("colors.setTheme now only accepts an object, not a string.  If you are trying to set a theme from a file, it is now your (the caller's) responsibility to require the file.  The old syntax looked like colors.setTheme(__dirname + '/../themes/generic-logging.js'); The new syntax looks like colors.setTheme(require(__dirname + '/../themes/generic-logging.js'));");
        return;
      }
      for (var style in theme) {
        (function(style2) {
          colors[style2] = function(str) {
            if (typeof theme[style2] === "object") {
              var out = str;
              for (var i in theme[style2]) {
                out = colors[theme[style2][i]](out);
              }
              return out;
            }
            return colors[theme[style2]](str);
          };
        })(style);
      }
    };
    function init() {
      var ret = {};
      Object.keys(styles).forEach(function(name) {
        ret[name] = {
          get: /* @__PURE__ */ __name(function() {
            return build([name]);
          }, "get")
        };
      });
      return ret;
    }
    __name(init, "init");
    var sequencer = /* @__PURE__ */ __name(function sequencer2(map2, str) {
      var exploded = str.split("");
      exploded = exploded.map(map2);
      return exploded.join("");
    }, "sequencer");
    colors.trap = require_trap();
    colors.zalgo = require_zalgo();
    colors.maps = {};
    colors.maps.america = require_america()(colors);
    colors.maps.zebra = require_zebra()(colors);
    colors.maps.rainbow = require_rainbow()(colors);
    colors.maps.random = require_random()(colors);
    for (map in colors.maps) {
      (function(map2) {
        colors[map2] = function(str) {
          return sequencer(colors.maps[map2], str);
        };
      })(map);
    }
    var map;
    defineProps(colors, init());
  }
});

// node_modules/@colors/colors/safe.js
var require_safe = __commonJS({
  "node_modules/@colors/colors/safe.js"(exports2, module2) {
    var colors = require_colors();
    module2["exports"] = colors;
  }
});

// node_modules/triple-beam/config/cli.js
var require_cli = __commonJS({
  "node_modules/triple-beam/config/cli.js"(exports2) {
    "use strict";
    exports2.levels = {
      error: 0,
      warn: 1,
      help: 2,
      data: 3,
      info: 4,
      debug: 5,
      prompt: 6,
      verbose: 7,
      input: 8,
      silly: 9
    };
    exports2.colors = {
      error: "red",
      warn: "yellow",
      help: "cyan",
      data: "grey",
      info: "green",
      debug: "blue",
      prompt: "grey",
      verbose: "cyan",
      input: "grey",
      silly: "magenta"
    };
  }
});

// node_modules/triple-beam/config/npm.js
var require_npm = __commonJS({
  "node_modules/triple-beam/config/npm.js"(exports2) {
    "use strict";
    exports2.levels = {
      error: 0,
      warn: 1,
      info: 2,
      http: 3,
      verbose: 4,
      debug: 5,
      silly: 6
    };
    exports2.colors = {
      error: "red",
      warn: "yellow",
      info: "green",
      http: "green",
      verbose: "cyan",
      debug: "blue",
      silly: "magenta"
    };
  }
});

// node_modules/triple-beam/config/syslog.js
var require_syslog = __commonJS({
  "node_modules/triple-beam/config/syslog.js"(exports2) {
    "use strict";
    exports2.levels = {
      emerg: 0,
      alert: 1,
      crit: 2,
      error: 3,
      warning: 4,
      notice: 5,
      info: 6,
      debug: 7
    };
    exports2.colors = {
      emerg: "red",
      alert: "yellow",
      crit: "red",
      error: "red",
      warning: "red",
      notice: "yellow",
      info: "green",
      debug: "blue"
    };
  }
});

// node_modules/triple-beam/config/index.js
var require_config = __commonJS({
  "node_modules/triple-beam/config/index.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "cli", {
      value: require_cli()
    });
    Object.defineProperty(exports2, "npm", {
      value: require_npm()
    });
    Object.defineProperty(exports2, "syslog", {
      value: require_syslog()
    });
  }
});

// node_modules/triple-beam/index.js
var require_triple_beam = __commonJS({
  "node_modules/triple-beam/index.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "LEVEL", {
      value: /* @__PURE__ */ Symbol.for("level")
    });
    Object.defineProperty(exports2, "MESSAGE", {
      value: /* @__PURE__ */ Symbol.for("message")
    });
    Object.defineProperty(exports2, "SPLAT", {
      value: /* @__PURE__ */ Symbol.for("splat")
    });
    Object.defineProperty(exports2, "configs", {
      value: require_config()
    });
  }
});

// node_modules/logform/colorize.js
var require_colorize = __commonJS({
  "node_modules/logform/colorize.js"(exports2, module2) {
    "use strict";
    var colors = require_safe();
    var { LEVEL, MESSAGE } = require_triple_beam();
    colors.enabled = true;
    var hasSpace = /\s+/;
    var Colorizer = class _Colorizer {
      static {
        __name(this, "Colorizer");
      }
      constructor(opts = {}) {
        if (opts.colors) {
          this.addColors(opts.colors);
        }
        this.options = opts;
      }
      /*
       * Adds the colors Object to the set of allColors
       * known by the Colorizer
       *
       * @param {Object} colors Set of color mappings to add.
       */
      static addColors(clrs) {
        const nextColors = Object.keys(clrs).reduce((acc, level) => {
          acc[level] = hasSpace.test(clrs[level]) ? clrs[level].split(hasSpace) : clrs[level];
          return acc;
        }, {});
        _Colorizer.allColors = Object.assign({}, _Colorizer.allColors || {}, nextColors);
        return _Colorizer.allColors;
      }
      /*
       * Adds the colors Object to the set of allColors
       * known by the Colorizer
       *
       * @param {Object} colors Set of color mappings to add.
       */
      addColors(clrs) {
        return _Colorizer.addColors(clrs);
      }
      /*
       * function colorize (lookup, level, message)
       * Performs multi-step colorization using @colors/colors/safe
       */
      colorize(lookup, level, message) {
        if (typeof message === "undefined") {
          message = level;
        }
        if (!Array.isArray(_Colorizer.allColors[lookup])) {
          return colors[_Colorizer.allColors[lookup]](message);
        }
        for (let i = 0, len = _Colorizer.allColors[lookup].length; i < len; i++) {
          message = colors[_Colorizer.allColors[lookup][i]](message);
        }
        return message;
      }
      /*
       * function transform (info, opts)
       * Attempts to colorize the { level, message } of the given
       * `logform` info object.
       */
      transform(info, opts) {
        if (opts.all && typeof info[MESSAGE] === "string") {
          info[MESSAGE] = this.colorize(info[LEVEL], info.level, info[MESSAGE]);
        }
        if (opts.level || opts.all || !opts.message) {
          info.level = this.colorize(info[LEVEL], info.level);
        }
        if (opts.all || opts.message) {
          info.message = this.colorize(info[LEVEL], info.level, info.message);
        }
        return info;
      }
    };
    module2.exports = (opts) => new Colorizer(opts);
    module2.exports.Colorizer = module2.exports.Format = Colorizer;
  }
});

// node_modules/logform/levels.js
var require_levels = __commonJS({
  "node_modules/logform/levels.js"(exports2, module2) {
    "use strict";
    var { Colorizer } = require_colorize();
    module2.exports = (config) => {
      Colorizer.addColors(config.colors || config);
      return config;
    };
  }
});

// node_modules/logform/align.js
var require_align = __commonJS({
  "node_modules/logform/align.js"(exports2, module2) {
    "use strict";
    var format = require_format();
    module2.exports = format((info) => {
      info.message = `	${info.message}`;
      return info;
    });
  }
});

// node_modules/logform/errors.js
var require_errors = __commonJS({
  "node_modules/logform/errors.js"(exports2, module2) {
    "use strict";
    var format = require_format();
    var { LEVEL, MESSAGE } = require_triple_beam();
    module2.exports = format((einfo, { stack, cause }) => {
      if (einfo instanceof Error) {
        const info = Object.assign({}, einfo, {
          level: einfo.level,
          [LEVEL]: einfo[LEVEL] || einfo.level,
          message: einfo.message,
          [MESSAGE]: einfo[MESSAGE] || einfo.message
        });
        if (stack) info.stack = einfo.stack;
        if (cause) info.cause = einfo.cause;
        return info;
      }
      if (!(einfo.message instanceof Error)) return einfo;
      const err = einfo.message;
      Object.assign(einfo, err);
      einfo.message = err.message;
      einfo[MESSAGE] = err.message;
      if (stack) einfo.stack = err.stack;
      if (cause) einfo.cause = err.cause;
      return einfo;
    });
  }
});

// node_modules/logform/pad-levels.js
var require_pad_levels = __commonJS({
  "node_modules/logform/pad-levels.js"(exports2, module2) {
    "use strict";
    var { configs, LEVEL, MESSAGE } = require_triple_beam();
    var Padder = class _Padder {
      static {
        __name(this, "Padder");
      }
      constructor(opts = { levels: configs.npm.levels }) {
        this.paddings = _Padder.paddingForLevels(opts.levels, opts.filler);
        this.options = opts;
      }
      /**
       * Returns the maximum length of keys in the specified `levels` Object.
       * @param  {Object} levels Set of all levels to calculate longest level against.
       * @returns {Number} Maximum length of the longest level string.
       */
      static getLongestLevel(levels) {
        const lvls = Object.keys(levels).map((level) => level.length);
        return Math.max(...lvls);
      }
      /**
       * Returns the padding for the specified `level` assuming that the
       * maximum length of all levels it's associated with is `maxLength`.
       * @param  {String} level Level to calculate padding for.
       * @param  {String} filler Repeatable text to use for padding.
       * @param  {Number} maxLength Length of the longest level
       * @returns {String} Padding string for the `level`
       */
      static paddingForLevel(level, filler, maxLength) {
        const targetLen = maxLength + 1 - level.length;
        const rep = Math.floor(targetLen / filler.length);
        const padding = `${filler}${filler.repeat(rep)}`;
        return padding.slice(0, targetLen);
      }
      /**
       * Returns an object with the string paddings for the given `levels`
       * using the specified `filler`.
       * @param  {Object} levels Set of all levels to calculate padding for.
       * @param  {String} filler Repeatable text to use for padding.
       * @returns {Object} Mapping of level to desired padding.
       */
      static paddingForLevels(levels, filler = " ") {
        const maxLength = _Padder.getLongestLevel(levels);
        return Object.keys(levels).reduce((acc, level) => {
          acc[level] = _Padder.paddingForLevel(level, filler, maxLength);
          return acc;
        }, {});
      }
      /**
       * Prepends the padding onto the `message` based on the `LEVEL` of
       * the `info`. This is based on the behavior of `winston@2` which also
       * prepended the level onto the message.
       *
       * See: https://github.com/winstonjs/winston/blob/2.x/lib/winston/logger.js#L198-L201
       *
       * @param  {Info} info Logform info object
       * @param  {Object} opts Options passed along to this instance.
       * @returns {Info} Modified logform info object.
       */
      transform(info, opts) {
        info.message = `${this.paddings[info[LEVEL]]}${info.message}`;
        if (info[MESSAGE]) {
          info[MESSAGE] = `${this.paddings[info[LEVEL]]}${info[MESSAGE]}`;
        }
        return info;
      }
    };
    module2.exports = (opts) => new Padder(opts);
    module2.exports.Padder = module2.exports.Format = Padder;
  }
});

// node_modules/logform/cli.js
var require_cli2 = __commonJS({
  "node_modules/logform/cli.js"(exports2, module2) {
    "use strict";
    var { Colorizer } = require_colorize();
    var { Padder } = require_pad_levels();
    var { configs, MESSAGE } = require_triple_beam();
    var CliFormat = class {
      static {
        __name(this, "CliFormat");
      }
      constructor(opts = {}) {
        if (!opts.levels) {
          opts.levels = configs.cli.levels;
        }
        this.colorizer = new Colorizer(opts);
        this.padder = new Padder(opts);
        this.options = opts;
      }
      /*
       * function transform (info, opts)
       * Attempts to both:
       * 1. Pad the { level }
       * 2. Colorize the { level, message }
       * of the given `logform` info object depending on the `opts`.
       */
      transform(info, opts) {
        this.colorizer.transform(
          this.padder.transform(info, opts),
          opts
        );
        info[MESSAGE] = `${info.level}:${info.message}`;
        return info;
      }
    };
    module2.exports = (opts) => new CliFormat(opts);
    module2.exports.Format = CliFormat;
  }
});

// node_modules/logform/combine.js
var require_combine = __commonJS({
  "node_modules/logform/combine.js"(exports2, module2) {
    "use strict";
    var format = require_format();
    function cascade(formats) {
      if (!formats.every(isValidFormat)) {
        return;
      }
      return (info) => {
        let obj = info;
        for (let i = 0; i < formats.length; i++) {
          obj = formats[i].transform(obj, formats[i].options);
          if (!obj) {
            return false;
          }
        }
        return obj;
      };
    }
    __name(cascade, "cascade");
    function isValidFormat(fmt) {
      if (typeof fmt.transform !== "function") {
        throw new Error([
          "No transform function found on format. Did you create a format instance?",
          "const myFormat = format(formatFn);",
          "const instance = myFormat();"
        ].join("\n"));
      }
      return true;
    }
    __name(isValidFormat, "isValidFormat");
    module2.exports = (...formats) => {
      const combinedFormat = format(cascade(formats));
      const instance = combinedFormat();
      instance.Format = combinedFormat.Format;
      return instance;
    };
    module2.exports.cascade = cascade;
  }
});

// node_modules/safe-stable-stringify/index.js
var require_safe_stable_stringify = __commonJS({
  "node_modules/safe-stable-stringify/index.js"(exports2, module2) {
    "use strict";
    var { hasOwnProperty } = Object.prototype;
    var stringify2 = configure();
    stringify2.configure = configure;
    stringify2.stringify = stringify2;
    stringify2.default = stringify2;
    exports2.stringify = stringify2;
    exports2.configure = configure;
    module2.exports = stringify2;
    var strEscapeSequencesRegExp = /[\u0000-\u001f\u0022\u005c\ud800-\udfff]/;
    function strEscape(str) {
      if (str.length < 5e3 && !strEscapeSequencesRegExp.test(str)) {
        return `"${str}"`;
      }
      return JSON.stringify(str);
    }
    __name(strEscape, "strEscape");
    function sort(array, comparator) {
      if (array.length > 200 || comparator) {
        return array.sort(comparator);
      }
      for (let i = 1; i < array.length; i++) {
        const currentValue = array[i];
        let position = i;
        while (position !== 0 && array[position - 1] > currentValue) {
          array[position] = array[position - 1];
          position--;
        }
        array[position] = currentValue;
      }
      return array;
    }
    __name(sort, "sort");
    var typedArrayPrototypeGetSymbolToStringTag = Object.getOwnPropertyDescriptor(
      Object.getPrototypeOf(
        Object.getPrototypeOf(
          new Int8Array()
        )
      ),
      Symbol.toStringTag
    ).get;
    function isTypedArrayWithEntries(value) {
      return typedArrayPrototypeGetSymbolToStringTag.call(value) !== void 0 && value.length !== 0;
    }
    __name(isTypedArrayWithEntries, "isTypedArrayWithEntries");
    function stringifyTypedArray(array, separator, maximumBreadth) {
      if (array.length < maximumBreadth) {
        maximumBreadth = array.length;
      }
      const whitespace = separator === "," ? "" : " ";
      let res = `"0":${whitespace}${array[0]}`;
      for (let i = 1; i < maximumBreadth; i++) {
        res += `${separator}"${i}":${whitespace}${array[i]}`;
      }
      return res;
    }
    __name(stringifyTypedArray, "stringifyTypedArray");
    function getCircularValueOption(options) {
      if (hasOwnProperty.call(options, "circularValue")) {
        const circularValue = options.circularValue;
        if (typeof circularValue === "string") {
          return `"${circularValue}"`;
        }
        if (circularValue == null) {
          return circularValue;
        }
        if (circularValue === Error || circularValue === TypeError) {
          return {
            toString() {
              throw new TypeError("Converting circular structure to JSON");
            }
          };
        }
        throw new TypeError('The "circularValue" argument must be of type string or the value null or undefined');
      }
      return '"[Circular]"';
    }
    __name(getCircularValueOption, "getCircularValueOption");
    function getDeterministicOption(options) {
      let value;
      if (hasOwnProperty.call(options, "deterministic")) {
        value = options.deterministic;
        if (typeof value !== "boolean" && typeof value !== "function") {
          throw new TypeError('The "deterministic" argument must be of type boolean or comparator function');
        }
      }
      return value === void 0 ? true : value;
    }
    __name(getDeterministicOption, "getDeterministicOption");
    function getBooleanOption(options, key) {
      let value;
      if (hasOwnProperty.call(options, key)) {
        value = options[key];
        if (typeof value !== "boolean") {
          throw new TypeError(`The "${key}" argument must be of type boolean`);
        }
      }
      return value === void 0 ? true : value;
    }
    __name(getBooleanOption, "getBooleanOption");
    function getPositiveIntegerOption(options, key) {
      let value;
      if (hasOwnProperty.call(options, key)) {
        value = options[key];
        if (typeof value !== "number") {
          throw new TypeError(`The "${key}" argument must be of type number`);
        }
        if (!Number.isInteger(value)) {
          throw new TypeError(`The "${key}" argument must be an integer`);
        }
        if (value < 1) {
          throw new RangeError(`The "${key}" argument must be >= 1`);
        }
      }
      return value === void 0 ? Infinity : value;
    }
    __name(getPositiveIntegerOption, "getPositiveIntegerOption");
    function getItemCount(number) {
      if (number === 1) {
        return "1 item";
      }
      return `${number} items`;
    }
    __name(getItemCount, "getItemCount");
    function getUniqueReplacerSet(replacerArray) {
      const replacerSet = /* @__PURE__ */ new Set();
      for (const value of replacerArray) {
        if (typeof value === "string" || typeof value === "number") {
          replacerSet.add(String(value));
        }
      }
      return replacerSet;
    }
    __name(getUniqueReplacerSet, "getUniqueReplacerSet");
    function getStrictOption(options) {
      if (hasOwnProperty.call(options, "strict")) {
        const value = options.strict;
        if (typeof value !== "boolean") {
          throw new TypeError('The "strict" argument must be of type boolean');
        }
        if (value) {
          return (value2) => {
            let message = `Object can not safely be stringified. Received type ${typeof value2}`;
            if (typeof value2 !== "function") message += ` (${value2.toString()})`;
            throw new Error(message);
          };
        }
      }
    }
    __name(getStrictOption, "getStrictOption");
    function configure(options) {
      options = { ...options };
      const fail = getStrictOption(options);
      if (fail) {
        if (options.bigint === void 0) {
          options.bigint = false;
        }
        if (!("circularValue" in options)) {
          options.circularValue = Error;
        }
      }
      const circularValue = getCircularValueOption(options);
      const bigint = getBooleanOption(options, "bigint");
      const deterministic = getDeterministicOption(options);
      const comparator = typeof deterministic === "function" ? deterministic : void 0;
      const maximumDepth = getPositiveIntegerOption(options, "maximumDepth");
      const maximumBreadth = getPositiveIntegerOption(options, "maximumBreadth");
      function stringifyFnReplacer(key, parent, stack, replacer, spacer, indentation) {
        let value = parent[key];
        if (typeof value === "object" && value !== null && typeof value.toJSON === "function") {
          value = value.toJSON(key);
        }
        value = replacer.call(parent, key, value);
        switch (typeof value) {
          case "string":
            return strEscape(value);
          case "object": {
            if (value === null) {
              return "null";
            }
            if (stack.indexOf(value) !== -1) {
              return circularValue;
            }
            let res = "";
            let join = ",";
            const originalIndentation = indentation;
            if (Array.isArray(value)) {
              if (value.length === 0) {
                return "[]";
              }
              if (maximumDepth < stack.length + 1) {
                return '"[Array]"';
              }
              stack.push(value);
              if (spacer !== "") {
                indentation += spacer;
                res += `
${indentation}`;
                join = `,
${indentation}`;
              }
              const maximumValuesToStringify = Math.min(value.length, maximumBreadth);
              let i = 0;
              for (; i < maximumValuesToStringify - 1; i++) {
                const tmp2 = stringifyFnReplacer(String(i), value, stack, replacer, spacer, indentation);
                res += tmp2 !== void 0 ? tmp2 : "null";
                res += join;
              }
              const tmp = stringifyFnReplacer(String(i), value, stack, replacer, spacer, indentation);
              res += tmp !== void 0 ? tmp : "null";
              if (value.length - 1 > maximumBreadth) {
                const removedKeys = value.length - maximumBreadth - 1;
                res += `${join}"... ${getItemCount(removedKeys)} not stringified"`;
              }
              if (spacer !== "") {
                res += `
${originalIndentation}`;
              }
              stack.pop();
              return `[${res}]`;
            }
            let keys = Object.keys(value);
            const keyLength = keys.length;
            if (keyLength === 0) {
              return "{}";
            }
            if (maximumDepth < stack.length + 1) {
              return '"[Object]"';
            }
            let whitespace = "";
            let separator = "";
            if (spacer !== "") {
              indentation += spacer;
              join = `,
${indentation}`;
              whitespace = " ";
            }
            const maximumPropertiesToStringify = Math.min(keyLength, maximumBreadth);
            if (deterministic && !isTypedArrayWithEntries(value)) {
              keys = sort(keys, comparator);
            }
            stack.push(value);
            for (let i = 0; i < maximumPropertiesToStringify; i++) {
              const key2 = keys[i];
              const tmp = stringifyFnReplacer(key2, value, stack, replacer, spacer, indentation);
              if (tmp !== void 0) {
                res += `${separator}${strEscape(key2)}:${whitespace}${tmp}`;
                separator = join;
              }
            }
            if (keyLength > maximumBreadth) {
              const removedKeys = keyLength - maximumBreadth;
              res += `${separator}"...":${whitespace}"${getItemCount(removedKeys)} not stringified"`;
              separator = join;
            }
            if (spacer !== "" && separator.length > 1) {
              res = `
${indentation}${res}
${originalIndentation}`;
            }
            stack.pop();
            return `{${res}}`;
          }
          case "number":
            return isFinite(value) ? String(value) : fail ? fail(value) : "null";
          case "boolean":
            return value === true ? "true" : "false";
          case "undefined":
            return void 0;
          case "bigint":
            if (bigint) {
              return String(value);
            }
          // fallthrough
          default:
            return fail ? fail(value) : void 0;
        }
      }
      __name(stringifyFnReplacer, "stringifyFnReplacer");
      function stringifyArrayReplacer(key, value, stack, replacer, spacer, indentation) {
        if (typeof value === "object" && value !== null && typeof value.toJSON === "function") {
          value = value.toJSON(key);
        }
        switch (typeof value) {
          case "string":
            return strEscape(value);
          case "object": {
            if (value === null) {
              return "null";
            }
            if (stack.indexOf(value) !== -1) {
              return circularValue;
            }
            const originalIndentation = indentation;
            let res = "";
            let join = ",";
            if (Array.isArray(value)) {
              if (value.length === 0) {
                return "[]";
              }
              if (maximumDepth < stack.length + 1) {
                return '"[Array]"';
              }
              stack.push(value);
              if (spacer !== "") {
                indentation += spacer;
                res += `
${indentation}`;
                join = `,
${indentation}`;
              }
              const maximumValuesToStringify = Math.min(value.length, maximumBreadth);
              let i = 0;
              for (; i < maximumValuesToStringify - 1; i++) {
                const tmp2 = stringifyArrayReplacer(String(i), value[i], stack, replacer, spacer, indentation);
                res += tmp2 !== void 0 ? tmp2 : "null";
                res += join;
              }
              const tmp = stringifyArrayReplacer(String(i), value[i], stack, replacer, spacer, indentation);
              res += tmp !== void 0 ? tmp : "null";
              if (value.length - 1 > maximumBreadth) {
                const removedKeys = value.length - maximumBreadth - 1;
                res += `${join}"... ${getItemCount(removedKeys)} not stringified"`;
              }
              if (spacer !== "") {
                res += `
${originalIndentation}`;
              }
              stack.pop();
              return `[${res}]`;
            }
            stack.push(value);
            let whitespace = "";
            if (spacer !== "") {
              indentation += spacer;
              join = `,
${indentation}`;
              whitespace = " ";
            }
            let separator = "";
            for (const key2 of replacer) {
              const tmp = stringifyArrayReplacer(key2, value[key2], stack, replacer, spacer, indentation);
              if (tmp !== void 0) {
                res += `${separator}${strEscape(key2)}:${whitespace}${tmp}`;
                separator = join;
              }
            }
            if (spacer !== "" && separator.length > 1) {
              res = `
${indentation}${res}
${originalIndentation}`;
            }
            stack.pop();
            return `{${res}}`;
          }
          case "number":
            return isFinite(value) ? String(value) : fail ? fail(value) : "null";
          case "boolean":
            return value === true ? "true" : "false";
          case "undefined":
            return void 0;
          case "bigint":
            if (bigint) {
              return String(value);
            }
          // fallthrough
          default:
            return fail ? fail(value) : void 0;
        }
      }
      __name(stringifyArrayReplacer, "stringifyArrayReplacer");
      function stringifyIndent(key, value, stack, spacer, indentation) {
        switch (typeof value) {
          case "string":
            return strEscape(value);
          case "object": {
            if (value === null) {
              return "null";
            }
            if (typeof value.toJSON === "function") {
              value = value.toJSON(key);
              if (typeof value !== "object") {
                return stringifyIndent(key, value, stack, spacer, indentation);
              }
              if (value === null) {
                return "null";
              }
            }
            if (stack.indexOf(value) !== -1) {
              return circularValue;
            }
            const originalIndentation = indentation;
            if (Array.isArray(value)) {
              if (value.length === 0) {
                return "[]";
              }
              if (maximumDepth < stack.length + 1) {
                return '"[Array]"';
              }
              stack.push(value);
              indentation += spacer;
              let res2 = `
${indentation}`;
              const join2 = `,
${indentation}`;
              const maximumValuesToStringify = Math.min(value.length, maximumBreadth);
              let i = 0;
              for (; i < maximumValuesToStringify - 1; i++) {
                const tmp2 = stringifyIndent(String(i), value[i], stack, spacer, indentation);
                res2 += tmp2 !== void 0 ? tmp2 : "null";
                res2 += join2;
              }
              const tmp = stringifyIndent(String(i), value[i], stack, spacer, indentation);
              res2 += tmp !== void 0 ? tmp : "null";
              if (value.length - 1 > maximumBreadth) {
                const removedKeys = value.length - maximumBreadth - 1;
                res2 += `${join2}"... ${getItemCount(removedKeys)} not stringified"`;
              }
              res2 += `
${originalIndentation}`;
              stack.pop();
              return `[${res2}]`;
            }
            let keys = Object.keys(value);
            const keyLength = keys.length;
            if (keyLength === 0) {
              return "{}";
            }
            if (maximumDepth < stack.length + 1) {
              return '"[Object]"';
            }
            indentation += spacer;
            const join = `,
${indentation}`;
            let res = "";
            let separator = "";
            let maximumPropertiesToStringify = Math.min(keyLength, maximumBreadth);
            if (isTypedArrayWithEntries(value)) {
              res += stringifyTypedArray(value, join, maximumBreadth);
              keys = keys.slice(value.length);
              maximumPropertiesToStringify -= value.length;
              separator = join;
            }
            if (deterministic) {
              keys = sort(keys, comparator);
            }
            stack.push(value);
            for (let i = 0; i < maximumPropertiesToStringify; i++) {
              const key2 = keys[i];
              const tmp = stringifyIndent(key2, value[key2], stack, spacer, indentation);
              if (tmp !== void 0) {
                res += `${separator}${strEscape(key2)}: ${tmp}`;
                separator = join;
              }
            }
            if (keyLength > maximumBreadth) {
              const removedKeys = keyLength - maximumBreadth;
              res += `${separator}"...": "${getItemCount(removedKeys)} not stringified"`;
              separator = join;
            }
            if (separator !== "") {
              res = `
${indentation}${res}
${originalIndentation}`;
            }
            stack.pop();
            return `{${res}}`;
          }
          case "number":
            return isFinite(value) ? String(value) : fail ? fail(value) : "null";
          case "boolean":
            return value === true ? "true" : "false";
          case "undefined":
            return void 0;
          case "bigint":
            if (bigint) {
              return String(value);
            }
          // fallthrough
          default:
            return fail ? fail(value) : void 0;
        }
      }
      __name(stringifyIndent, "stringifyIndent");
      function stringifySimple(key, value, stack) {
        switch (typeof value) {
          case "string":
            return strEscape(value);
          case "object": {
            if (value === null) {
              return "null";
            }
            if (typeof value.toJSON === "function") {
              value = value.toJSON(key);
              if (typeof value !== "object") {
                return stringifySimple(key, value, stack);
              }
              if (value === null) {
                return "null";
              }
            }
            if (stack.indexOf(value) !== -1) {
              return circularValue;
            }
            let res = "";
            const hasLength = value.length !== void 0;
            if (hasLength && Array.isArray(value)) {
              if (value.length === 0) {
                return "[]";
              }
              if (maximumDepth < stack.length + 1) {
                return '"[Array]"';
              }
              stack.push(value);
              const maximumValuesToStringify = Math.min(value.length, maximumBreadth);
              let i = 0;
              for (; i < maximumValuesToStringify - 1; i++) {
                const tmp2 = stringifySimple(String(i), value[i], stack);
                res += tmp2 !== void 0 ? tmp2 : "null";
                res += ",";
              }
              const tmp = stringifySimple(String(i), value[i], stack);
              res += tmp !== void 0 ? tmp : "null";
              if (value.length - 1 > maximumBreadth) {
                const removedKeys = value.length - maximumBreadth - 1;
                res += `,"... ${getItemCount(removedKeys)} not stringified"`;
              }
              stack.pop();
              return `[${res}]`;
            }
            let keys = Object.keys(value);
            const keyLength = keys.length;
            if (keyLength === 0) {
              return "{}";
            }
            if (maximumDepth < stack.length + 1) {
              return '"[Object]"';
            }
            let separator = "";
            let maximumPropertiesToStringify = Math.min(keyLength, maximumBreadth);
            if (hasLength && isTypedArrayWithEntries(value)) {
              res += stringifyTypedArray(value, ",", maximumBreadth);
              keys = keys.slice(value.length);
              maximumPropertiesToStringify -= value.length;
              separator = ",";
            }
            if (deterministic) {
              keys = sort(keys, comparator);
            }
            stack.push(value);
            for (let i = 0; i < maximumPropertiesToStringify; i++) {
              const key2 = keys[i];
              const tmp = stringifySimple(key2, value[key2], stack);
              if (tmp !== void 0) {
                res += `${separator}${strEscape(key2)}:${tmp}`;
                separator = ",";
              }
            }
            if (keyLength > maximumBreadth) {
              const removedKeys = keyLength - maximumBreadth;
              res += `${separator}"...":"${getItemCount(removedKeys)} not stringified"`;
            }
            stack.pop();
            return `{${res}}`;
          }
          case "number":
            return isFinite(value) ? String(value) : fail ? fail(value) : "null";
          case "boolean":
            return value === true ? "true" : "false";
          case "undefined":
            return void 0;
          case "bigint":
            if (bigint) {
              return String(value);
            }
          // fallthrough
          default:
            return fail ? fail(value) : void 0;
        }
      }
      __name(stringifySimple, "stringifySimple");
      function stringify3(value, replacer, space) {
        if (arguments.length > 1) {
          let spacer = "";
          if (typeof space === "number") {
            spacer = " ".repeat(Math.min(space, 10));
          } else if (typeof space === "string") {
            spacer = space.slice(0, 10);
          }
          if (replacer != null) {
            if (typeof replacer === "function") {
              return stringifyFnReplacer("", { "": value }, [], replacer, spacer, "");
            }
            if (Array.isArray(replacer)) {
              return stringifyArrayReplacer("", value, [], getUniqueReplacerSet(replacer), spacer, "");
            }
          }
          if (spacer.length !== 0) {
            return stringifyIndent("", value, [], spacer, "");
          }
        }
        return stringifySimple("", value, []);
      }
      __name(stringify3, "stringify");
      return stringify3;
    }
    __name(configure, "configure");
  }
});

// node_modules/logform/json.js
var require_json = __commonJS({
  "node_modules/logform/json.js"(exports2, module2) {
    "use strict";
    var format = require_format();
    var { MESSAGE } = require_triple_beam();
    var stringify2 = require_safe_stable_stringify();
    function replacer(key, value) {
      if (typeof value === "bigint")
        return value.toString();
      return value;
    }
    __name(replacer, "replacer");
    module2.exports = format((info, opts) => {
      const jsonStringify = stringify2.configure(opts);
      info[MESSAGE] = jsonStringify(info, opts.replacer || replacer, opts.space);
      return info;
    });
  }
});

// node_modules/logform/label.js
var require_label = __commonJS({
  "node_modules/logform/label.js"(exports2, module2) {
    "use strict";
    var format = require_format();
    module2.exports = format((info, opts) => {
      if (opts.message) {
        info.message = `[${opts.label}] ${info.message}`;
        return info;
      }
      info.label = opts.label;
      return info;
    });
  }
});

// node_modules/logform/logstash.js
var require_logstash = __commonJS({
  "node_modules/logform/logstash.js"(exports2, module2) {
    "use strict";
    var format = require_format();
    var { MESSAGE } = require_triple_beam();
    var jsonStringify = require_safe_stable_stringify();
    module2.exports = format((info) => {
      const logstash = {};
      if (info.message) {
        logstash["@message"] = info.message;
        delete info.message;
      }
      if (info.timestamp) {
        logstash["@timestamp"] = info.timestamp;
        delete info.timestamp;
      }
      logstash["@fields"] = info;
      info[MESSAGE] = jsonStringify(logstash);
      return info;
    });
  }
});

// node_modules/logform/metadata.js
var require_metadata = __commonJS({
  "node_modules/logform/metadata.js"(exports2, module2) {
    "use strict";
    var format = require_format();
    function fillExcept(info, fillExceptKeys, metadataKey) {
      const savedKeys = fillExceptKeys.reduce((acc, key) => {
        acc[key] = info[key];
        delete info[key];
        return acc;
      }, {});
      const metadata = Object.keys(info).reduce((acc, key) => {
        acc[key] = info[key];
        delete info[key];
        return acc;
      }, {});
      Object.assign(info, savedKeys, {
        [metadataKey]: metadata
      });
      return info;
    }
    __name(fillExcept, "fillExcept");
    function fillWith(info, fillWithKeys, metadataKey) {
      info[metadataKey] = fillWithKeys.reduce((acc, key) => {
        acc[key] = info[key];
        delete info[key];
        return acc;
      }, {});
      return info;
    }
    __name(fillWith, "fillWith");
    module2.exports = format((info, opts = {}) => {
      let metadataKey = "metadata";
      if (opts.key) {
        metadataKey = opts.key;
      }
      let fillExceptKeys = [];
      if (!opts.fillExcept && !opts.fillWith) {
        fillExceptKeys.push("level");
        fillExceptKeys.push("message");
      }
      if (opts.fillExcept) {
        fillExceptKeys = opts.fillExcept;
      }
      if (fillExceptKeys.length > 0) {
        return fillExcept(info, fillExceptKeys, metadataKey);
      }
      if (opts.fillWith) {
        return fillWith(info, opts.fillWith, metadataKey);
      }
      return info;
    });
  }
});

// node_modules/ms/index.js
var require_ms = __commonJS({
  "node_modules/ms/index.js"(exports2, module2) {
    var s = 1e3;
    var m = s * 60;
    var h = m * 60;
    var d = h * 24;
    var w = d * 7;
    var y = d * 365.25;
    module2.exports = function(val, options) {
      options = options || {};
      var type = typeof val;
      if (type === "string" && val.length > 0) {
        return parse(val);
      } else if (type === "number" && isFinite(val)) {
        return options.long ? fmtLong(val) : fmtShort(val);
      }
      throw new Error(
        "val is not a non-empty string or a valid number. val=" + JSON.stringify(val)
      );
    };
    function parse(str) {
      str = String(str);
      if (str.length > 100) {
        return;
      }
      var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
        str
      );
      if (!match) {
        return;
      }
      var n = parseFloat(match[1]);
      var type = (match[2] || "ms").toLowerCase();
      switch (type) {
        case "years":
        case "year":
        case "yrs":
        case "yr":
        case "y":
          return n * y;
        case "weeks":
        case "week":
        case "w":
          return n * w;
        case "days":
        case "day":
        case "d":
          return n * d;
        case "hours":
        case "hour":
        case "hrs":
        case "hr":
        case "h":
          return n * h;
        case "minutes":
        case "minute":
        case "mins":
        case "min":
        case "m":
          return n * m;
        case "seconds":
        case "second":
        case "secs":
        case "sec":
        case "s":
          return n * s;
        case "milliseconds":
        case "millisecond":
        case "msecs":
        case "msec":
        case "ms":
          return n;
        default:
          return void 0;
      }
    }
    __name(parse, "parse");
    function fmtShort(ms) {
      var msAbs = Math.abs(ms);
      if (msAbs >= d) {
        return Math.round(ms / d) + "d";
      }
      if (msAbs >= h) {
        return Math.round(ms / h) + "h";
      }
      if (msAbs >= m) {
        return Math.round(ms / m) + "m";
      }
      if (msAbs >= s) {
        return Math.round(ms / s) + "s";
      }
      return ms + "ms";
    }
    __name(fmtShort, "fmtShort");
    function fmtLong(ms) {
      var msAbs = Math.abs(ms);
      if (msAbs >= d) {
        return plural(ms, msAbs, d, "day");
      }
      if (msAbs >= h) {
        return plural(ms, msAbs, h, "hour");
      }
      if (msAbs >= m) {
        return plural(ms, msAbs, m, "minute");
      }
      if (msAbs >= s) {
        return plural(ms, msAbs, s, "second");
      }
      return ms + " ms";
    }
    __name(fmtLong, "fmtLong");
    function plural(ms, msAbs, n, name) {
      var isPlural = msAbs >= n * 1.5;
      return Math.round(ms / n) + " " + name + (isPlural ? "s" : "");
    }
    __name(plural, "plural");
  }
});

// node_modules/logform/ms.js
var require_ms2 = __commonJS({
  "node_modules/logform/ms.js"(exports2, module2) {
    "use strict";
    var format = require_format();
    var ms = require_ms();
    module2.exports = format((info) => {
      const curr = +/* @__PURE__ */ new Date();
      exports2.diff = curr - (exports2.prevTime || curr);
      exports2.prevTime = curr;
      info.ms = `+${ms(exports2.diff)}`;
      return info;
    });
  }
});

// node_modules/logform/pretty-print.js
var require_pretty_print = __commonJS({
  "node_modules/logform/pretty-print.js"(exports2, module2) {
    "use strict";
    var inspect = require("util").inspect;
    var format = require_format();
    var { LEVEL, MESSAGE, SPLAT } = require_triple_beam();
    module2.exports = format((info, opts = {}) => {
      const stripped = Object.assign({}, info);
      delete stripped[LEVEL];
      delete stripped[MESSAGE];
      delete stripped[SPLAT];
      info[MESSAGE] = inspect(stripped, false, opts.depth || null, opts.colorize);
      return info;
    });
  }
});

// node_modules/logform/printf.js
var require_printf = __commonJS({
  "node_modules/logform/printf.js"(exports2, module2) {
    "use strict";
    var { MESSAGE } = require_triple_beam();
    var Printf = class {
      static {
        __name(this, "Printf");
      }
      constructor(templateFn) {
        this.template = templateFn;
      }
      transform(info) {
        info[MESSAGE] = this.template(info);
        return info;
      }
    };
    module2.exports = (opts) => new Printf(opts);
    module2.exports.Printf = module2.exports.Format = Printf;
  }
});

// node_modules/logform/simple.js
var require_simple = __commonJS({
  "node_modules/logform/simple.js"(exports2, module2) {
    "use strict";
    var format = require_format();
    var { MESSAGE } = require_triple_beam();
    var jsonStringify = require_safe_stable_stringify();
    module2.exports = format((info) => {
      const stringifiedRest = jsonStringify(Object.assign({}, info, {
        level: void 0,
        message: void 0,
        splat: void 0
      }));
      const padding = info.padding && info.padding[info.level] || "";
      if (stringifiedRest !== "{}") {
        info[MESSAGE] = `${info.level}:${padding} ${info.message} ${stringifiedRest}`;
      } else {
        info[MESSAGE] = `${info.level}:${padding} ${info.message}`;
      }
      return info;
    });
  }
});

// node_modules/logform/splat.js
var require_splat = __commonJS({
  "node_modules/logform/splat.js"(exports2, module2) {
    "use strict";
    var util = require("util");
    var { SPLAT } = require_triple_beam();
    var formatRegExp = /%[scdjifoO%]/g;
    var escapedPercent = /%%/g;
    var Splatter = class {
      static {
        __name(this, "Splatter");
      }
      constructor(opts) {
        this.options = opts;
      }
      /**
         * Check to see if tokens <= splat.length, assign { splat, meta } into the
         * `info` accordingly, and write to this instance.
         *
         * @param  {Info} info Logform info message.
         * @param  {String[]} tokens Set of string interpolation tokens.
         * @returns {Info} Modified info message
         * @private
         */
      _splat(info, tokens) {
        const msg = info.message;
        const splat = info[SPLAT] || info.splat || [];
        const percents = msg.match(escapedPercent);
        const escapes = percents && percents.length || 0;
        const expectedSplat = tokens.length - escapes;
        const extraSplat = expectedSplat - splat.length;
        const metas = extraSplat < 0 ? splat.splice(extraSplat, -1 * extraSplat) : [];
        const metalen = metas.length;
        if (metalen) {
          for (let i = 0; i < metalen; i++) {
            Object.assign(info, metas[i]);
          }
        }
        info.message = util.format(msg, ...splat);
        return info;
      }
      /**
        * Transforms the `info` message by using `util.format` to complete
        * any `info.message` provided it has string interpolation tokens.
        * If no tokens exist then `info` is immutable.
        *
        * @param  {Info} info Logform info message.
        * @param  {Object} opts Options for this instance.
        * @returns {Info} Modified info message
        */
      transform(info) {
        const msg = info.message;
        const splat = info[SPLAT] || info.splat;
        if (!splat || !splat.length) {
          return info;
        }
        const tokens = msg && msg.match && msg.match(formatRegExp);
        if (!tokens && (splat || splat.length)) {
          const metas = splat.length > 1 ? splat.splice(0) : splat;
          const metalen = metas.length;
          if (metalen) {
            for (let i = 0; i < metalen; i++) {
              Object.assign(info, metas[i]);
            }
          }
          return info;
        }
        if (tokens) {
          return this._splat(info, tokens);
        }
        return info;
      }
    };
    module2.exports = (opts) => new Splatter(opts);
  }
});

// node_modules/fecha/lib/fecha.umd.js
var require_fecha_umd = __commonJS({
  "node_modules/fecha/lib/fecha.umd.js"(exports2, module2) {
    (function(global2, factory) {
      typeof exports2 === "object" && typeof module2 !== "undefined" ? factory(exports2) : typeof define === "function" && define.amd ? define(["exports"], factory) : factory(global2.fecha = {});
    })(exports2, (function(exports3) {
      "use strict";
      var token = /d{1,4}|M{1,4}|YY(?:YY)?|S{1,3}|Do|ZZ|Z|([HhMsDm])\1?|[aA]|"[^"]*"|'[^']*'/g;
      var twoDigitsOptional = "\\d\\d?";
      var twoDigits = "\\d\\d";
      var threeDigits = "\\d{3}";
      var fourDigits = "\\d{4}";
      var word = "[^\\s]+";
      var literal = /\[([^]*?)\]/gm;
      function shorten(arr, sLen) {
        var newArr = [];
        for (var i = 0, len = arr.length; i < len; i++) {
          newArr.push(arr[i].substr(0, sLen));
        }
        return newArr;
      }
      __name(shorten, "shorten");
      var monthUpdate = /* @__PURE__ */ __name(function(arrName) {
        return function(v, i18n) {
          var lowerCaseArr = i18n[arrName].map(function(v2) {
            return v2.toLowerCase();
          });
          var index = lowerCaseArr.indexOf(v.toLowerCase());
          if (index > -1) {
            return index;
          }
          return null;
        };
      }, "monthUpdate");
      function assign(origObj) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
          args[_i - 1] = arguments[_i];
        }
        for (var _a = 0, args_1 = args; _a < args_1.length; _a++) {
          var obj = args_1[_a];
          for (var key in obj) {
            origObj[key] = obj[key];
          }
        }
        return origObj;
      }
      __name(assign, "assign");
      var dayNames = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
      ];
      var monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
      ];
      var monthNamesShort = shorten(monthNames, 3);
      var dayNamesShort = shorten(dayNames, 3);
      var defaultI18n = {
        dayNamesShort,
        dayNames,
        monthNamesShort,
        monthNames,
        amPm: ["am", "pm"],
        DoFn: /* @__PURE__ */ __name(function(dayOfMonth) {
          return dayOfMonth + ["th", "st", "nd", "rd"][dayOfMonth % 10 > 3 ? 0 : (dayOfMonth - dayOfMonth % 10 !== 10 ? 1 : 0) * dayOfMonth % 10];
        }, "DoFn")
      };
      var globalI18n = assign({}, defaultI18n);
      var setGlobalDateI18n = /* @__PURE__ */ __name(function(i18n) {
        return globalI18n = assign(globalI18n, i18n);
      }, "setGlobalDateI18n");
      var regexEscape = /* @__PURE__ */ __name(function(str) {
        return str.replace(/[|\\{()[^$+*?.-]/g, "\\$&");
      }, "regexEscape");
      var pad = /* @__PURE__ */ __name(function(val, len) {
        if (len === void 0) {
          len = 2;
        }
        val = String(val);
        while (val.length < len) {
          val = "0" + val;
        }
        return val;
      }, "pad");
      var formatFlags = {
        D: /* @__PURE__ */ __name(function(dateObj) {
          return String(dateObj.getDate());
        }, "D"),
        DD: /* @__PURE__ */ __name(function(dateObj) {
          return pad(dateObj.getDate());
        }, "DD"),
        Do: /* @__PURE__ */ __name(function(dateObj, i18n) {
          return i18n.DoFn(dateObj.getDate());
        }, "Do"),
        d: /* @__PURE__ */ __name(function(dateObj) {
          return String(dateObj.getDay());
        }, "d"),
        dd: /* @__PURE__ */ __name(function(dateObj) {
          return pad(dateObj.getDay());
        }, "dd"),
        ddd: /* @__PURE__ */ __name(function(dateObj, i18n) {
          return i18n.dayNamesShort[dateObj.getDay()];
        }, "ddd"),
        dddd: /* @__PURE__ */ __name(function(dateObj, i18n) {
          return i18n.dayNames[dateObj.getDay()];
        }, "dddd"),
        M: /* @__PURE__ */ __name(function(dateObj) {
          return String(dateObj.getMonth() + 1);
        }, "M"),
        MM: /* @__PURE__ */ __name(function(dateObj) {
          return pad(dateObj.getMonth() + 1);
        }, "MM"),
        MMM: /* @__PURE__ */ __name(function(dateObj, i18n) {
          return i18n.monthNamesShort[dateObj.getMonth()];
        }, "MMM"),
        MMMM: /* @__PURE__ */ __name(function(dateObj, i18n) {
          return i18n.monthNames[dateObj.getMonth()];
        }, "MMMM"),
        YY: /* @__PURE__ */ __name(function(dateObj) {
          return pad(String(dateObj.getFullYear()), 4).substr(2);
        }, "YY"),
        YYYY: /* @__PURE__ */ __name(function(dateObj) {
          return pad(dateObj.getFullYear(), 4);
        }, "YYYY"),
        h: /* @__PURE__ */ __name(function(dateObj) {
          return String(dateObj.getHours() % 12 || 12);
        }, "h"),
        hh: /* @__PURE__ */ __name(function(dateObj) {
          return pad(dateObj.getHours() % 12 || 12);
        }, "hh"),
        H: /* @__PURE__ */ __name(function(dateObj) {
          return String(dateObj.getHours());
        }, "H"),
        HH: /* @__PURE__ */ __name(function(dateObj) {
          return pad(dateObj.getHours());
        }, "HH"),
        m: /* @__PURE__ */ __name(function(dateObj) {
          return String(dateObj.getMinutes());
        }, "m"),
        mm: /* @__PURE__ */ __name(function(dateObj) {
          return pad(dateObj.getMinutes());
        }, "mm"),
        s: /* @__PURE__ */ __name(function(dateObj) {
          return String(dateObj.getSeconds());
        }, "s"),
        ss: /* @__PURE__ */ __name(function(dateObj) {
          return pad(dateObj.getSeconds());
        }, "ss"),
        S: /* @__PURE__ */ __name(function(dateObj) {
          return String(Math.round(dateObj.getMilliseconds() / 100));
        }, "S"),
        SS: /* @__PURE__ */ __name(function(dateObj) {
          return pad(Math.round(dateObj.getMilliseconds() / 10), 2);
        }, "SS"),
        SSS: /* @__PURE__ */ __name(function(dateObj) {
          return pad(dateObj.getMilliseconds(), 3);
        }, "SSS"),
        a: /* @__PURE__ */ __name(function(dateObj, i18n) {
          return dateObj.getHours() < 12 ? i18n.amPm[0] : i18n.amPm[1];
        }, "a"),
        A: /* @__PURE__ */ __name(function(dateObj, i18n) {
          return dateObj.getHours() < 12 ? i18n.amPm[0].toUpperCase() : i18n.amPm[1].toUpperCase();
        }, "A"),
        ZZ: /* @__PURE__ */ __name(function(dateObj) {
          var offset = dateObj.getTimezoneOffset();
          return (offset > 0 ? "-" : "+") + pad(Math.floor(Math.abs(offset) / 60) * 100 + Math.abs(offset) % 60, 4);
        }, "ZZ"),
        Z: /* @__PURE__ */ __name(function(dateObj) {
          var offset = dateObj.getTimezoneOffset();
          return (offset > 0 ? "-" : "+") + pad(Math.floor(Math.abs(offset) / 60), 2) + ":" + pad(Math.abs(offset) % 60, 2);
        }, "Z")
      };
      var monthParse = /* @__PURE__ */ __name(function(v) {
        return +v - 1;
      }, "monthParse");
      var emptyDigits = [null, twoDigitsOptional];
      var emptyWord = [null, word];
      var amPm = [
        "isPm",
        word,
        function(v, i18n) {
          var val = v.toLowerCase();
          if (val === i18n.amPm[0]) {
            return 0;
          } else if (val === i18n.amPm[1]) {
            return 1;
          }
          return null;
        }
      ];
      var timezoneOffset = [
        "timezoneOffset",
        "[^\\s]*?[\\+\\-]\\d\\d:?\\d\\d|[^\\s]*?Z?",
        function(v) {
          var parts = (v + "").match(/([+-]|\d\d)/gi);
          if (parts) {
            var minutes = +parts[1] * 60 + parseInt(parts[2], 10);
            return parts[0] === "+" ? minutes : -minutes;
          }
          return 0;
        }
      ];
      var parseFlags = {
        D: ["day", twoDigitsOptional],
        DD: ["day", twoDigits],
        Do: ["day", twoDigitsOptional + word, function(v) {
          return parseInt(v, 10);
        }],
        M: ["month", twoDigitsOptional, monthParse],
        MM: ["month", twoDigits, monthParse],
        YY: [
          "year",
          twoDigits,
          function(v) {
            var now = /* @__PURE__ */ new Date();
            var cent = +("" + now.getFullYear()).substr(0, 2);
            return +("" + (+v > 68 ? cent - 1 : cent) + v);
          }
        ],
        h: ["hour", twoDigitsOptional, void 0, "isPm"],
        hh: ["hour", twoDigits, void 0, "isPm"],
        H: ["hour", twoDigitsOptional],
        HH: ["hour", twoDigits],
        m: ["minute", twoDigitsOptional],
        mm: ["minute", twoDigits],
        s: ["second", twoDigitsOptional],
        ss: ["second", twoDigits],
        YYYY: ["year", fourDigits],
        S: ["millisecond", "\\d", function(v) {
          return +v * 100;
        }],
        SS: ["millisecond", twoDigits, function(v) {
          return +v * 10;
        }],
        SSS: ["millisecond", threeDigits],
        d: emptyDigits,
        dd: emptyDigits,
        ddd: emptyWord,
        dddd: emptyWord,
        MMM: ["month", word, monthUpdate("monthNamesShort")],
        MMMM: ["month", word, monthUpdate("monthNames")],
        a: amPm,
        A: amPm,
        ZZ: timezoneOffset,
        Z: timezoneOffset
      };
      var globalMasks = {
        default: "ddd MMM DD YYYY HH:mm:ss",
        shortDate: "M/D/YY",
        mediumDate: "MMM D, YYYY",
        longDate: "MMMM D, YYYY",
        fullDate: "dddd, MMMM D, YYYY",
        isoDate: "YYYY-MM-DD",
        isoDateTime: "YYYY-MM-DDTHH:mm:ssZ",
        shortTime: "HH:mm",
        mediumTime: "HH:mm:ss",
        longTime: "HH:mm:ss.SSS"
      };
      var setGlobalDateMasks = /* @__PURE__ */ __name(function(masks) {
        return assign(globalMasks, masks);
      }, "setGlobalDateMasks");
      var format = /* @__PURE__ */ __name(function(dateObj, mask, i18n) {
        if (mask === void 0) {
          mask = globalMasks["default"];
        }
        if (i18n === void 0) {
          i18n = {};
        }
        if (typeof dateObj === "number") {
          dateObj = new Date(dateObj);
        }
        if (Object.prototype.toString.call(dateObj) !== "[object Date]" || isNaN(dateObj.getTime())) {
          throw new Error("Invalid Date pass to format");
        }
        mask = globalMasks[mask] || mask;
        var literals = [];
        mask = mask.replace(literal, function($0, $1) {
          literals.push($1);
          return "@@@";
        });
        var combinedI18nSettings = assign(assign({}, globalI18n), i18n);
        mask = mask.replace(token, function($0) {
          return formatFlags[$0](dateObj, combinedI18nSettings);
        });
        return mask.replace(/@@@/g, function() {
          return literals.shift();
        });
      }, "format");
      function parse(dateStr, format2, i18n) {
        if (i18n === void 0) {
          i18n = {};
        }
        if (typeof format2 !== "string") {
          throw new Error("Invalid format in fecha parse");
        }
        format2 = globalMasks[format2] || format2;
        if (dateStr.length > 1e3) {
          return null;
        }
        var today = /* @__PURE__ */ new Date();
        var dateInfo = {
          year: today.getFullYear(),
          month: 0,
          day: 1,
          hour: 0,
          minute: 0,
          second: 0,
          millisecond: 0,
          isPm: null,
          timezoneOffset: null
        };
        var parseInfo = [];
        var literals = [];
        var newFormat = format2.replace(literal, function($0, $1) {
          literals.push(regexEscape($1));
          return "@@@";
        });
        var specifiedFields = {};
        var requiredFields = {};
        newFormat = regexEscape(newFormat).replace(token, function($0) {
          var info = parseFlags[$0];
          var field2 = info[0], regex = info[1], requiredField = info[3];
          if (specifiedFields[field2]) {
            throw new Error("Invalid format. " + field2 + " specified twice in format");
          }
          specifiedFields[field2] = true;
          if (requiredField) {
            requiredFields[requiredField] = true;
          }
          parseInfo.push(info);
          return "(" + regex + ")";
        });
        Object.keys(requiredFields).forEach(function(field2) {
          if (!specifiedFields[field2]) {
            throw new Error("Invalid format. " + field2 + " is required in specified format");
          }
        });
        newFormat = newFormat.replace(/@@@/g, function() {
          return literals.shift();
        });
        var matches = dateStr.match(new RegExp(newFormat, "i"));
        if (!matches) {
          return null;
        }
        var combinedI18nSettings = assign(assign({}, globalI18n), i18n);
        for (var i = 1; i < matches.length; i++) {
          var _a = parseInfo[i - 1], field = _a[0], parser = _a[2];
          var value = parser ? parser(matches[i], combinedI18nSettings) : +matches[i];
          if (value == null) {
            return null;
          }
          dateInfo[field] = value;
        }
        if (dateInfo.isPm === 1 && dateInfo.hour != null && +dateInfo.hour !== 12) {
          dateInfo.hour = +dateInfo.hour + 12;
        } else if (dateInfo.isPm === 0 && +dateInfo.hour === 12) {
          dateInfo.hour = 0;
        }
        var dateTZ;
        if (dateInfo.timezoneOffset == null) {
          dateTZ = new Date(dateInfo.year, dateInfo.month, dateInfo.day, dateInfo.hour, dateInfo.minute, dateInfo.second, dateInfo.millisecond);
          var validateFields = [
            ["month", "getMonth"],
            ["day", "getDate"],
            ["hour", "getHours"],
            ["minute", "getMinutes"],
            ["second", "getSeconds"]
          ];
          for (var i = 0, len = validateFields.length; i < len; i++) {
            if (specifiedFields[validateFields[i][0]] && dateInfo[validateFields[i][0]] !== dateTZ[validateFields[i][1]]()) {
              return null;
            }
          }
        } else {
          dateTZ = new Date(Date.UTC(dateInfo.year, dateInfo.month, dateInfo.day, dateInfo.hour, dateInfo.minute - dateInfo.timezoneOffset, dateInfo.second, dateInfo.millisecond));
          if (dateInfo.month > 11 || dateInfo.month < 0 || dateInfo.day > 31 || dateInfo.day < 1 || dateInfo.hour > 23 || dateInfo.hour < 0 || dateInfo.minute > 59 || dateInfo.minute < 0 || dateInfo.second > 59 || dateInfo.second < 0) {
            return null;
          }
        }
        return dateTZ;
      }
      __name(parse, "parse");
      var fecha = {
        format,
        parse,
        defaultI18n,
        setGlobalDateI18n,
        setGlobalDateMasks
      };
      exports3.assign = assign;
      exports3.default = fecha;
      exports3.format = format;
      exports3.parse = parse;
      exports3.defaultI18n = defaultI18n;
      exports3.setGlobalDateI18n = setGlobalDateI18n;
      exports3.setGlobalDateMasks = setGlobalDateMasks;
      Object.defineProperty(exports3, "__esModule", { value: true });
    }));
  }
});

// node_modules/logform/timestamp.js
var require_timestamp = __commonJS({
  "node_modules/logform/timestamp.js"(exports2, module2) {
    "use strict";
    var fecha = require_fecha_umd();
    var format = require_format();
    module2.exports = format((info, opts = {}) => {
      if (opts.format) {
        info.timestamp = typeof opts.format === "function" ? opts.format() : fecha.format(/* @__PURE__ */ new Date(), opts.format);
      }
      if (!info.timestamp) {
        info.timestamp = (/* @__PURE__ */ new Date()).toISOString();
      }
      if (opts.alias) {
        info[opts.alias] = info.timestamp;
      }
      return info;
    });
  }
});

// node_modules/logform/uncolorize.js
var require_uncolorize = __commonJS({
  "node_modules/logform/uncolorize.js"(exports2, module2) {
    "use strict";
    var colors = require_safe();
    var format = require_format();
    var { MESSAGE } = require_triple_beam();
    module2.exports = format((info, opts) => {
      if (opts.level !== false) {
        info.level = colors.strip(info.level);
      }
      if (opts.message !== false) {
        info.message = colors.strip(String(info.message));
      }
      if (opts.raw !== false && info[MESSAGE]) {
        info[MESSAGE] = colors.strip(String(info[MESSAGE]));
      }
      return info;
    });
  }
});

// node_modules/logform/index.js
var require_logform = __commonJS({
  "node_modules/logform/index.js"(exports2) {
    "use strict";
    var format = exports2.format = require_format();
    exports2.levels = require_levels();
    function exposeFormat(name, requireFormat) {
      Object.defineProperty(format, name, {
        get() {
          return requireFormat();
        },
        configurable: true
      });
    }
    __name(exposeFormat, "exposeFormat");
    exposeFormat("align", function() {
      return require_align();
    });
    exposeFormat("errors", function() {
      return require_errors();
    });
    exposeFormat("cli", function() {
      return require_cli2();
    });
    exposeFormat("combine", function() {
      return require_combine();
    });
    exposeFormat("colorize", function() {
      return require_colorize();
    });
    exposeFormat("json", function() {
      return require_json();
    });
    exposeFormat("label", function() {
      return require_label();
    });
    exposeFormat("logstash", function() {
      return require_logstash();
    });
    exposeFormat("metadata", function() {
      return require_metadata();
    });
    exposeFormat("ms", function() {
      return require_ms2();
    });
    exposeFormat("padLevels", function() {
      return require_pad_levels();
    });
    exposeFormat("prettyPrint", function() {
      return require_pretty_print();
    });
    exposeFormat("printf", function() {
      return require_printf();
    });
    exposeFormat("simple", function() {
      return require_simple();
    });
    exposeFormat("splat", function() {
      return require_splat();
    });
    exposeFormat("timestamp", function() {
      return require_timestamp();
    });
    exposeFormat("uncolorize", function() {
      return require_uncolorize();
    });
  }
});

// node_modules/winston/lib/winston/common.js
var require_common = __commonJS({
  "node_modules/winston/lib/winston/common.js"(exports2) {
    "use strict";
    var { format } = require("util");
    exports2.warn = {
      deprecated(prop) {
        return () => {
          throw new Error(format("{ %s } was removed in winston@3.0.0.", prop));
        };
      },
      useFormat(prop) {
        return () => {
          throw new Error([
            format("{ %s } was removed in winston@3.0.0.", prop),
            "Use a custom winston.format = winston.format(function) instead."
          ].join("\n"));
        };
      },
      forFunctions(obj, type, props) {
        props.forEach((prop) => {
          obj[prop] = exports2.warn[type](prop);
        });
      },
      forProperties(obj, type, props) {
        props.forEach((prop) => {
          const notice = exports2.warn[type](prop);
          Object.defineProperty(obj, prop, {
            get: notice,
            set: notice
          });
        });
      }
    };
  }
});

// node_modules/winston/package.json
var require_package = __commonJS({
  "node_modules/winston/package.json"(exports2, module2) {
    module2.exports = {
      name: "winston",
      description: "A logger for just about everything.",
      version: "3.19.0",
      author: "Charlie Robbins <charlie.robbins@gmail.com>",
      maintainers: [
        "David Hyde <dabh@alumni.stanford.edu>"
      ],
      repository: {
        type: "git",
        url: "https://github.com/winstonjs/winston.git"
      },
      keywords: [
        "winston",
        "logger",
        "logging",
        "logs",
        "sysadmin",
        "bunyan",
        "pino",
        "loglevel",
        "tools",
        "json",
        "stream"
      ],
      dependencies: {
        "@dabh/diagnostics": "^2.0.8",
        "@colors/colors": "^1.6.0",
        async: "^3.2.3",
        "is-stream": "^2.0.0",
        logform: "^2.7.0",
        "one-time": "^1.0.0",
        "readable-stream": "^3.4.0",
        "safe-stable-stringify": "^2.3.1",
        "stack-trace": "0.0.x",
        "triple-beam": "^1.3.0",
        "winston-transport": "^4.9.0"
      },
      devDependencies: {
        "@babel/cli": "^7.23.9",
        "@babel/core": "^7.24.0",
        "@babel/preset-env": "^7.24.0",
        "@dabh/eslint-config-populist": "^4.4.0",
        "@types/node": "^20.11.24",
        "abstract-winston-transport": "^0.5.1",
        assume: "^2.2.0",
        "cross-spawn-async": "^2.2.5",
        eslint: "^8.57.0",
        hock: "^1.4.1",
        jest: "^29.7.0",
        rimraf: "5.0.10",
        split2: "^4.1.0",
        "std-mocks": "^2.0.0",
        through2: "^4.0.2",
        "winston-compat": "^0.1.5"
      },
      main: "./lib/winston.js",
      browser: "./dist/winston",
      types: "./index.d.ts",
      scripts: {
        lint: "eslint lib/*.js lib/winston/*.js lib/winston/**/*.js --resolve-plugins-relative-to ./node_modules/@dabh/eslint-config-populist",
        test: "jest",
        "test:unit": "jest -c test/jest.config.unit.js",
        "test:integration": "jest -c test/jest.config.integration.js",
        "test:typescript": "npx --package typescript tsc --project test",
        build: "babel lib -d dist",
        prebuild: "rimraf dist",
        prepublishOnly: "npm run build"
      },
      engines: {
        node: ">= 12.0.0"
      },
      license: "MIT"
    };
  }
});

// node_modules/util-deprecate/node.js
var require_node = __commonJS({
  "node_modules/util-deprecate/node.js"(exports2, module2) {
    module2.exports = require("util").deprecate;
  }
});

// node_modules/winston-transport/node_modules/readable-stream/lib/internal/streams/stream.js
var require_stream = __commonJS({
  "node_modules/winston-transport/node_modules/readable-stream/lib/internal/streams/stream.js"(exports2, module2) {
    module2.exports = require("stream");
  }
});

// node_modules/winston-transport/node_modules/readable-stream/lib/internal/streams/destroy.js
var require_destroy = __commonJS({
  "node_modules/winston-transport/node_modules/readable-stream/lib/internal/streams/destroy.js"(exports2, module2) {
    "use strict";
    function destroy(err, cb) {
      var _this = this;
      var readableDestroyed = this._readableState && this._readableState.destroyed;
      var writableDestroyed = this._writableState && this._writableState.destroyed;
      if (readableDestroyed || writableDestroyed) {
        if (cb) {
          cb(err);
        } else if (err) {
          if (!this._writableState) {
            process.nextTick(emitErrorNT, this, err);
          } else if (!this._writableState.errorEmitted) {
            this._writableState.errorEmitted = true;
            process.nextTick(emitErrorNT, this, err);
          }
        }
        return this;
      }
      if (this._readableState) {
        this._readableState.destroyed = true;
      }
      if (this._writableState) {
        this._writableState.destroyed = true;
      }
      this._destroy(err || null, function(err2) {
        if (!cb && err2) {
          if (!_this._writableState) {
            process.nextTick(emitErrorAndCloseNT, _this, err2);
          } else if (!_this._writableState.errorEmitted) {
            _this._writableState.errorEmitted = true;
            process.nextTick(emitErrorAndCloseNT, _this, err2);
          } else {
            process.nextTick(emitCloseNT, _this);
          }
        } else if (cb) {
          process.nextTick(emitCloseNT, _this);
          cb(err2);
        } else {
          process.nextTick(emitCloseNT, _this);
        }
      });
      return this;
    }
    __name(destroy, "destroy");
    function emitErrorAndCloseNT(self2, err) {
      emitErrorNT(self2, err);
      emitCloseNT(self2);
    }
    __name(emitErrorAndCloseNT, "emitErrorAndCloseNT");
    function emitCloseNT(self2) {
      if (self2._writableState && !self2._writableState.emitClose) return;
      if (self2._readableState && !self2._readableState.emitClose) return;
      self2.emit("close");
    }
    __name(emitCloseNT, "emitCloseNT");
    function undestroy() {
      if (this._readableState) {
        this._readableState.destroyed = false;
        this._readableState.reading = false;
        this._readableState.ended = false;
        this._readableState.endEmitted = false;
      }
      if (this._writableState) {
        this._writableState.destroyed = false;
        this._writableState.ended = false;
        this._writableState.ending = false;
        this._writableState.finalCalled = false;
        this._writableState.prefinished = false;
        this._writableState.finished = false;
        this._writableState.errorEmitted = false;
      }
    }
    __name(undestroy, "undestroy");
    function emitErrorNT(self2, err) {
      self2.emit("error", err);
    }
    __name(emitErrorNT, "emitErrorNT");
    function errorOrDestroy(stream, err) {
      var rState = stream._readableState;
      var wState = stream._writableState;
      if (rState && rState.autoDestroy || wState && wState.autoDestroy) stream.destroy(err);
      else stream.emit("error", err);
    }
    __name(errorOrDestroy, "errorOrDestroy");
    module2.exports = {
      destroy,
      undestroy,
      errorOrDestroy
    };
  }
});

// node_modules/winston-transport/node_modules/readable-stream/errors.js
var require_errors2 = __commonJS({
  "node_modules/winston-transport/node_modules/readable-stream/errors.js"(exports2, module2) {
    "use strict";
    var codes = {};
    function createErrorType(code, message, Base) {
      if (!Base) {
        Base = Error;
      }
      function getMessage(arg1, arg2, arg3) {
        if (typeof message === "string") {
          return message;
        } else {
          return message(arg1, arg2, arg3);
        }
      }
      __name(getMessage, "getMessage");
      class NodeError extends Base {
        static {
          __name(this, "NodeError");
        }
        constructor(arg1, arg2, arg3) {
          super(getMessage(arg1, arg2, arg3));
        }
      }
      NodeError.prototype.name = Base.name;
      NodeError.prototype.code = code;
      codes[code] = NodeError;
    }
    __name(createErrorType, "createErrorType");
    function oneOf(expected, thing) {
      if (Array.isArray(expected)) {
        const len = expected.length;
        expected = expected.map((i) => String(i));
        if (len > 2) {
          return `one of ${thing} ${expected.slice(0, len - 1).join(", ")}, or ` + expected[len - 1];
        } else if (len === 2) {
          return `one of ${thing} ${expected[0]} or ${expected[1]}`;
        } else {
          return `of ${thing} ${expected[0]}`;
        }
      } else {
        return `of ${thing} ${String(expected)}`;
      }
    }
    __name(oneOf, "oneOf");
    function startsWith(str, search, pos) {
      return str.substr(!pos || pos < 0 ? 0 : +pos, search.length) === search;
    }
    __name(startsWith, "startsWith");
    function endsWith(str, search, this_len) {
      if (this_len === void 0 || this_len > str.length) {
        this_len = str.length;
      }
      return str.substring(this_len - search.length, this_len) === search;
    }
    __name(endsWith, "endsWith");
    function includes(str, search, start) {
      if (typeof start !== "number") {
        start = 0;
      }
      if (start + search.length > str.length) {
        return false;
      } else {
        return str.indexOf(search, start) !== -1;
      }
    }
    __name(includes, "includes");
    createErrorType("ERR_INVALID_OPT_VALUE", function(name, value) {
      return 'The value "' + value + '" is invalid for option "' + name + '"';
    }, TypeError);
    createErrorType("ERR_INVALID_ARG_TYPE", function(name, expected, actual) {
      let determiner;
      if (typeof expected === "string" && startsWith(expected, "not ")) {
        determiner = "must not be";
        expected = expected.replace(/^not /, "");
      } else {
        determiner = "must be";
      }
      let msg;
      if (endsWith(name, " argument")) {
        msg = `The ${name} ${determiner} ${oneOf(expected, "type")}`;
      } else {
        const type = includes(name, ".") ? "property" : "argument";
        msg = `The "${name}" ${type} ${determiner} ${oneOf(expected, "type")}`;
      }
      msg += `. Received type ${typeof actual}`;
      return msg;
    }, TypeError);
    createErrorType("ERR_STREAM_PUSH_AFTER_EOF", "stream.push() after EOF");
    createErrorType("ERR_METHOD_NOT_IMPLEMENTED", function(name) {
      return "The " + name + " method is not implemented";
    });
    createErrorType("ERR_STREAM_PREMATURE_CLOSE", "Premature close");
    createErrorType("ERR_STREAM_DESTROYED", function(name) {
      return "Cannot call " + name + " after a stream was destroyed";
    });
    createErrorType("ERR_MULTIPLE_CALLBACK", "Callback called multiple times");
    createErrorType("ERR_STREAM_CANNOT_PIPE", "Cannot pipe, not readable");
    createErrorType("ERR_STREAM_WRITE_AFTER_END", "write after end");
    createErrorType("ERR_STREAM_NULL_VALUES", "May not write null values to stream", TypeError);
    createErrorType("ERR_UNKNOWN_ENCODING", function(arg) {
      return "Unknown encoding: " + arg;
    }, TypeError);
    createErrorType("ERR_STREAM_UNSHIFT_AFTER_END_EVENT", "stream.unshift() after end event");
    module2.exports.codes = codes;
  }
});

// node_modules/winston-transport/node_modules/readable-stream/lib/internal/streams/state.js
var require_state = __commonJS({
  "node_modules/winston-transport/node_modules/readable-stream/lib/internal/streams/state.js"(exports2, module2) {
    "use strict";
    var ERR_INVALID_OPT_VALUE = require_errors2().codes.ERR_INVALID_OPT_VALUE;
    function highWaterMarkFrom(options, isDuplex, duplexKey) {
      return options.highWaterMark != null ? options.highWaterMark : isDuplex ? options[duplexKey] : null;
    }
    __name(highWaterMarkFrom, "highWaterMarkFrom");
    function getHighWaterMark(state2, options, duplexKey, isDuplex) {
      var hwm = highWaterMarkFrom(options, isDuplex, duplexKey);
      if (hwm != null) {
        if (!(isFinite(hwm) && Math.floor(hwm) === hwm) || hwm < 0) {
          var name = isDuplex ? duplexKey : "highWaterMark";
          throw new ERR_INVALID_OPT_VALUE(name, hwm);
        }
        return Math.floor(hwm);
      }
      return state2.objectMode ? 16 : 16 * 1024;
    }
    __name(getHighWaterMark, "getHighWaterMark");
    module2.exports = {
      getHighWaterMark
    };
  }
});

// node_modules/inherits/inherits_browser.js
var require_inherits_browser = __commonJS({
  "node_modules/inherits/inherits_browser.js"(exports2, module2) {
    if (typeof Object.create === "function") {
      module2.exports = /* @__PURE__ */ __name(function inherits(ctor, superCtor) {
        if (superCtor) {
          ctor.super_ = superCtor;
          ctor.prototype = Object.create(superCtor.prototype, {
            constructor: {
              value: ctor,
              enumerable: false,
              writable: true,
              configurable: true
            }
          });
        }
      }, "inherits");
    } else {
      module2.exports = /* @__PURE__ */ __name(function inherits(ctor, superCtor) {
        if (superCtor) {
          ctor.super_ = superCtor;
          var TempCtor = /* @__PURE__ */ __name(function() {
          }, "TempCtor");
          TempCtor.prototype = superCtor.prototype;
          ctor.prototype = new TempCtor();
          ctor.prototype.constructor = ctor;
        }
      }, "inherits");
    }
  }
});

// node_modules/inherits/inherits.js
var require_inherits = __commonJS({
  "node_modules/inherits/inherits.js"(exports2, module2) {
    try {
      util = require("util");
      if (typeof util.inherits !== "function") throw "";
      module2.exports = util.inherits;
    } catch (e) {
      module2.exports = require_inherits_browser();
    }
    var util;
  }
});

// node_modules/winston-transport/node_modules/readable-stream/lib/internal/streams/buffer_list.js
var require_buffer_list = __commonJS({
  "node_modules/winston-transport/node_modules/readable-stream/lib/internal/streams/buffer_list.js"(exports2, module2) {
    "use strict";
    function ownKeys(object, enumerableOnly) {
      var keys = Object.keys(object);
      if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        enumerableOnly && (symbols = symbols.filter(function(sym) {
          return Object.getOwnPropertyDescriptor(object, sym).enumerable;
        })), keys.push.apply(keys, symbols);
      }
      return keys;
    }
    __name(ownKeys, "ownKeys");
    function _objectSpread(target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = null != arguments[i] ? arguments[i] : {};
        i % 2 ? ownKeys(Object(source), true).forEach(function(key) {
          _defineProperty(target, key, source[key]);
        }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function(key) {
          Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
      }
      return target;
    }
    __name(_objectSpread, "_objectSpread");
    function _defineProperty(obj, key, value) {
      key = _toPropertyKey(key);
      if (key in obj) {
        Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
      } else {
        obj[key] = value;
      }
      return obj;
    }
    __name(_defineProperty, "_defineProperty");
    function _classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
      }
    }
    __name(_classCallCheck, "_classCallCheck");
    function _defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor);
      }
    }
    __name(_defineProperties, "_defineProperties");
    function _createClass(Constructor, protoProps, staticProps) {
      if (protoProps) _defineProperties(Constructor.prototype, protoProps);
      if (staticProps) _defineProperties(Constructor, staticProps);
      Object.defineProperty(Constructor, "prototype", { writable: false });
      return Constructor;
    }
    __name(_createClass, "_createClass");
    function _toPropertyKey(arg) {
      var key = _toPrimitive(arg, "string");
      return typeof key === "symbol" ? key : String(key);
    }
    __name(_toPropertyKey, "_toPropertyKey");
    function _toPrimitive(input, hint) {
      if (typeof input !== "object" || input === null) return input;
      var prim = input[Symbol.toPrimitive];
      if (prim !== void 0) {
        var res = prim.call(input, hint || "default");
        if (typeof res !== "object") return res;
        throw new TypeError("@@toPrimitive must return a primitive value.");
      }
      return (hint === "string" ? String : Number)(input);
    }
    __name(_toPrimitive, "_toPrimitive");
    var _require = require("buffer");
    var Buffer2 = _require.Buffer;
    var _require2 = require("util");
    var inspect = _require2.inspect;
    var custom = inspect && inspect.custom || "inspect";
    function copyBuffer(src, target, offset) {
      Buffer2.prototype.copy.call(src, target, offset);
    }
    __name(copyBuffer, "copyBuffer");
    module2.exports = /* @__PURE__ */ (function() {
      function BufferList() {
        _classCallCheck(this, BufferList);
        this.head = null;
        this.tail = null;
        this.length = 0;
      }
      __name(BufferList, "BufferList");
      _createClass(BufferList, [{
        key: "push",
        value: /* @__PURE__ */ __name(function push(v) {
          var entry = {
            data: v,
            next: null
          };
          if (this.length > 0) this.tail.next = entry;
          else this.head = entry;
          this.tail = entry;
          ++this.length;
        }, "push")
      }, {
        key: "unshift",
        value: /* @__PURE__ */ __name(function unshift(v) {
          var entry = {
            data: v,
            next: this.head
          };
          if (this.length === 0) this.tail = entry;
          this.head = entry;
          ++this.length;
        }, "unshift")
      }, {
        key: "shift",
        value: /* @__PURE__ */ __name(function shift() {
          if (this.length === 0) return;
          var ret = this.head.data;
          if (this.length === 1) this.head = this.tail = null;
          else this.head = this.head.next;
          --this.length;
          return ret;
        }, "shift")
      }, {
        key: "clear",
        value: /* @__PURE__ */ __name(function clear() {
          this.head = this.tail = null;
          this.length = 0;
        }, "clear")
      }, {
        key: "join",
        value: /* @__PURE__ */ __name(function join(s) {
          if (this.length === 0) return "";
          var p = this.head;
          var ret = "" + p.data;
          while (p = p.next) ret += s + p.data;
          return ret;
        }, "join")
      }, {
        key: "concat",
        value: /* @__PURE__ */ __name(function concat(n) {
          if (this.length === 0) return Buffer2.alloc(0);
          var ret = Buffer2.allocUnsafe(n >>> 0);
          var p = this.head;
          var i = 0;
          while (p) {
            copyBuffer(p.data, ret, i);
            i += p.data.length;
            p = p.next;
          }
          return ret;
        }, "concat")
        // Consumes a specified amount of bytes or characters from the buffered data.
      }, {
        key: "consume",
        value: /* @__PURE__ */ __name(function consume(n, hasStrings) {
          var ret;
          if (n < this.head.data.length) {
            ret = this.head.data.slice(0, n);
            this.head.data = this.head.data.slice(n);
          } else if (n === this.head.data.length) {
            ret = this.shift();
          } else {
            ret = hasStrings ? this._getString(n) : this._getBuffer(n);
          }
          return ret;
        }, "consume")
      }, {
        key: "first",
        value: /* @__PURE__ */ __name(function first() {
          return this.head.data;
        }, "first")
        // Consumes a specified amount of characters from the buffered data.
      }, {
        key: "_getString",
        value: /* @__PURE__ */ __name(function _getString(n) {
          var p = this.head;
          var c = 1;
          var ret = p.data;
          n -= ret.length;
          while (p = p.next) {
            var str = p.data;
            var nb = n > str.length ? str.length : n;
            if (nb === str.length) ret += str;
            else ret += str.slice(0, n);
            n -= nb;
            if (n === 0) {
              if (nb === str.length) {
                ++c;
                if (p.next) this.head = p.next;
                else this.head = this.tail = null;
              } else {
                this.head = p;
                p.data = str.slice(nb);
              }
              break;
            }
            ++c;
          }
          this.length -= c;
          return ret;
        }, "_getString")
        // Consumes a specified amount of bytes from the buffered data.
      }, {
        key: "_getBuffer",
        value: /* @__PURE__ */ __name(function _getBuffer(n) {
          var ret = Buffer2.allocUnsafe(n);
          var p = this.head;
          var c = 1;
          p.data.copy(ret);
          n -= p.data.length;
          while (p = p.next) {
            var buf = p.data;
            var nb = n > buf.length ? buf.length : n;
            buf.copy(ret, ret.length - n, 0, nb);
            n -= nb;
            if (n === 0) {
              if (nb === buf.length) {
                ++c;
                if (p.next) this.head = p.next;
                else this.head = this.tail = null;
              } else {
                this.head = p;
                p.data = buf.slice(nb);
              }
              break;
            }
            ++c;
          }
          this.length -= c;
          return ret;
        }, "_getBuffer")
        // Make sure the linked list only shows the minimal necessary information.
      }, {
        key: custom,
        value: /* @__PURE__ */ __name(function value(_, options) {
          return inspect(this, _objectSpread(_objectSpread({}, options), {}, {
            // Only inspect one level.
            depth: 0,
            // It should not recurse.
            customInspect: false
          }));
        }, "value")
      }]);
      return BufferList;
    })();
  }
});

// node_modules/string_decoder/node_modules/safe-buffer/index.js
var require_safe_buffer = __commonJS({
  "node_modules/string_decoder/node_modules/safe-buffer/index.js"(exports2, module2) {
    var buffer = require("buffer");
    var Buffer2 = buffer.Buffer;
    function copyProps(src, dst) {
      for (var key in src) {
        dst[key] = src[key];
      }
    }
    __name(copyProps, "copyProps");
    if (Buffer2.from && Buffer2.alloc && Buffer2.allocUnsafe && Buffer2.allocUnsafeSlow) {
      module2.exports = buffer;
    } else {
      copyProps(buffer, exports2);
      exports2.Buffer = SafeBuffer;
    }
    function SafeBuffer(arg, encodingOrOffset, length) {
      return Buffer2(arg, encodingOrOffset, length);
    }
    __name(SafeBuffer, "SafeBuffer");
    copyProps(Buffer2, SafeBuffer);
    SafeBuffer.from = function(arg, encodingOrOffset, length) {
      if (typeof arg === "number") {
        throw new TypeError("Argument must not be a number");
      }
      return Buffer2(arg, encodingOrOffset, length);
    };
    SafeBuffer.alloc = function(size, fill, encoding) {
      if (typeof size !== "number") {
        throw new TypeError("Argument must be a number");
      }
      var buf = Buffer2(size);
      if (fill !== void 0) {
        if (typeof encoding === "string") {
          buf.fill(fill, encoding);
        } else {
          buf.fill(fill);
        }
      } else {
        buf.fill(0);
      }
      return buf;
    };
    SafeBuffer.allocUnsafe = function(size) {
      if (typeof size !== "number") {
        throw new TypeError("Argument must be a number");
      }
      return Buffer2(size);
    };
    SafeBuffer.allocUnsafeSlow = function(size) {
      if (typeof size !== "number") {
        throw new TypeError("Argument must be a number");
      }
      return buffer.SlowBuffer(size);
    };
  }
});

// node_modules/string_decoder/lib/string_decoder.js
var require_string_decoder = __commonJS({
  "node_modules/string_decoder/lib/string_decoder.js"(exports2) {
    "use strict";
    var Buffer2 = require_safe_buffer().Buffer;
    var isEncoding = Buffer2.isEncoding || function(encoding) {
      encoding = "" + encoding;
      switch (encoding && encoding.toLowerCase()) {
        case "hex":
        case "utf8":
        case "utf-8":
        case "ascii":
        case "binary":
        case "base64":
        case "ucs2":
        case "ucs-2":
        case "utf16le":
        case "utf-16le":
        case "raw":
          return true;
        default:
          return false;
      }
    };
    function _normalizeEncoding(enc) {
      if (!enc) return "utf8";
      var retried;
      while (true) {
        switch (enc) {
          case "utf8":
          case "utf-8":
            return "utf8";
          case "ucs2":
          case "ucs-2":
          case "utf16le":
          case "utf-16le":
            return "utf16le";
          case "latin1":
          case "binary":
            return "latin1";
          case "base64":
          case "ascii":
          case "hex":
            return enc;
          default:
            if (retried) return;
            enc = ("" + enc).toLowerCase();
            retried = true;
        }
      }
    }
    __name(_normalizeEncoding, "_normalizeEncoding");
    function normalizeEncoding(enc) {
      var nenc = _normalizeEncoding(enc);
      if (typeof nenc !== "string" && (Buffer2.isEncoding === isEncoding || !isEncoding(enc))) throw new Error("Unknown encoding: " + enc);
      return nenc || enc;
    }
    __name(normalizeEncoding, "normalizeEncoding");
    exports2.StringDecoder = StringDecoder;
    function StringDecoder(encoding) {
      this.encoding = normalizeEncoding(encoding);
      var nb;
      switch (this.encoding) {
        case "utf16le":
          this.text = utf16Text;
          this.end = utf16End;
          nb = 4;
          break;
        case "utf8":
          this.fillLast = utf8FillLast;
          nb = 4;
          break;
        case "base64":
          this.text = base64Text;
          this.end = base64End;
          nb = 3;
          break;
        default:
          this.write = simpleWrite;
          this.end = simpleEnd;
          return;
      }
      this.lastNeed = 0;
      this.lastTotal = 0;
      this.lastChar = Buffer2.allocUnsafe(nb);
    }
    __name(StringDecoder, "StringDecoder");
    StringDecoder.prototype.write = function(buf) {
      if (buf.length === 0) return "";
      var r;
      var i;
      if (this.lastNeed) {
        r = this.fillLast(buf);
        if (r === void 0) return "";
        i = this.lastNeed;
        this.lastNeed = 0;
      } else {
        i = 0;
      }
      if (i < buf.length) return r ? r + this.text(buf, i) : this.text(buf, i);
      return r || "";
    };
    StringDecoder.prototype.end = utf8End;
    StringDecoder.prototype.text = utf8Text;
    StringDecoder.prototype.fillLast = function(buf) {
      if (this.lastNeed <= buf.length) {
        buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed);
        return this.lastChar.toString(this.encoding, 0, this.lastTotal);
      }
      buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, buf.length);
      this.lastNeed -= buf.length;
    };
    function utf8CheckByte(byte) {
      if (byte <= 127) return 0;
      else if (byte >> 5 === 6) return 2;
      else if (byte >> 4 === 14) return 3;
      else if (byte >> 3 === 30) return 4;
      return byte >> 6 === 2 ? -1 : -2;
    }
    __name(utf8CheckByte, "utf8CheckByte");
    function utf8CheckIncomplete(self2, buf, i) {
      var j = buf.length - 1;
      if (j < i) return 0;
      var nb = utf8CheckByte(buf[j]);
      if (nb >= 0) {
        if (nb > 0) self2.lastNeed = nb - 1;
        return nb;
      }
      if (--j < i || nb === -2) return 0;
      nb = utf8CheckByte(buf[j]);
      if (nb >= 0) {
        if (nb > 0) self2.lastNeed = nb - 2;
        return nb;
      }
      if (--j < i || nb === -2) return 0;
      nb = utf8CheckByte(buf[j]);
      if (nb >= 0) {
        if (nb > 0) {
          if (nb === 2) nb = 0;
          else self2.lastNeed = nb - 3;
        }
        return nb;
      }
      return 0;
    }
    __name(utf8CheckIncomplete, "utf8CheckIncomplete");
    function utf8CheckExtraBytes(self2, buf, p) {
      if ((buf[0] & 192) !== 128) {
        self2.lastNeed = 0;
        return "\uFFFD";
      }
      if (self2.lastNeed > 1 && buf.length > 1) {
        if ((buf[1] & 192) !== 128) {
          self2.lastNeed = 1;
          return "\uFFFD";
        }
        if (self2.lastNeed > 2 && buf.length > 2) {
          if ((buf[2] & 192) !== 128) {
            self2.lastNeed = 2;
            return "\uFFFD";
          }
        }
      }
    }
    __name(utf8CheckExtraBytes, "utf8CheckExtraBytes");
    function utf8FillLast(buf) {
      var p = this.lastTotal - this.lastNeed;
      var r = utf8CheckExtraBytes(this, buf, p);
      if (r !== void 0) return r;
      if (this.lastNeed <= buf.length) {
        buf.copy(this.lastChar, p, 0, this.lastNeed);
        return this.lastChar.toString(this.encoding, 0, this.lastTotal);
      }
      buf.copy(this.lastChar, p, 0, buf.length);
      this.lastNeed -= buf.length;
    }
    __name(utf8FillLast, "utf8FillLast");
    function utf8Text(buf, i) {
      var total = utf8CheckIncomplete(this, buf, i);
      if (!this.lastNeed) return buf.toString("utf8", i);
      this.lastTotal = total;
      var end = buf.length - (total - this.lastNeed);
      buf.copy(this.lastChar, 0, end);
      return buf.toString("utf8", i, end);
    }
    __name(utf8Text, "utf8Text");
    function utf8End(buf) {
      var r = buf && buf.length ? this.write(buf) : "";
      if (this.lastNeed) return r + "\uFFFD";
      return r;
    }
    __name(utf8End, "utf8End");
    function utf16Text(buf, i) {
      if ((buf.length - i) % 2 === 0) {
        var r = buf.toString("utf16le", i);
        if (r) {
          var c = r.charCodeAt(r.length - 1);
          if (c >= 55296 && c <= 56319) {
            this.lastNeed = 2;
            this.lastTotal = 4;
            this.lastChar[0] = buf[buf.length - 2];
            this.lastChar[1] = buf[buf.length - 1];
            return r.slice(0, -1);
          }
        }
        return r;
      }
      this.lastNeed = 1;
      this.lastTotal = 2;
      this.lastChar[0] = buf[buf.length - 1];
      return buf.toString("utf16le", i, buf.length - 1);
    }
    __name(utf16Text, "utf16Text");
    function utf16End(buf) {
      var r = buf && buf.length ? this.write(buf) : "";
      if (this.lastNeed) {
        var end = this.lastTotal - this.lastNeed;
        return r + this.lastChar.toString("utf16le", 0, end);
      }
      return r;
    }
    __name(utf16End, "utf16End");
    function base64Text(buf, i) {
      var n = (buf.length - i) % 3;
      if (n === 0) return buf.toString("base64", i);
      this.lastNeed = 3 - n;
      this.lastTotal = 3;
      if (n === 1) {
        this.lastChar[0] = buf[buf.length - 1];
      } else {
        this.lastChar[0] = buf[buf.length - 2];
        this.lastChar[1] = buf[buf.length - 1];
      }
      return buf.toString("base64", i, buf.length - n);
    }
    __name(base64Text, "base64Text");
    function base64End(buf) {
      var r = buf && buf.length ? this.write(buf) : "";
      if (this.lastNeed) return r + this.lastChar.toString("base64", 0, 3 - this.lastNeed);
      return r;
    }
    __name(base64End, "base64End");
    function simpleWrite(buf) {
      return buf.toString(this.encoding);
    }
    __name(simpleWrite, "simpleWrite");
    function simpleEnd(buf) {
      return buf && buf.length ? this.write(buf) : "";
    }
    __name(simpleEnd, "simpleEnd");
  }
});

// node_modules/winston-transport/node_modules/readable-stream/lib/internal/streams/end-of-stream.js
var require_end_of_stream = __commonJS({
  "node_modules/winston-transport/node_modules/readable-stream/lib/internal/streams/end-of-stream.js"(exports2, module2) {
    "use strict";
    var ERR_STREAM_PREMATURE_CLOSE = require_errors2().codes.ERR_STREAM_PREMATURE_CLOSE;
    function once(callback) {
      var called = false;
      return function() {
        if (called) return;
        called = true;
        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }
        callback.apply(this, args);
      };
    }
    __name(once, "once");
    function noop() {
    }
    __name(noop, "noop");
    function isRequest(stream) {
      return stream.setHeader && typeof stream.abort === "function";
    }
    __name(isRequest, "isRequest");
    function eos(stream, opts, callback) {
      if (typeof opts === "function") return eos(stream, null, opts);
      if (!opts) opts = {};
      callback = once(callback || noop);
      var readable = opts.readable || opts.readable !== false && stream.readable;
      var writable = opts.writable || opts.writable !== false && stream.writable;
      var onlegacyfinish = /* @__PURE__ */ __name(function onlegacyfinish2() {
        if (!stream.writable) onfinish();
      }, "onlegacyfinish");
      var writableEnded = stream._writableState && stream._writableState.finished;
      var onfinish = /* @__PURE__ */ __name(function onfinish2() {
        writable = false;
        writableEnded = true;
        if (!readable) callback.call(stream);
      }, "onfinish");
      var readableEnded = stream._readableState && stream._readableState.endEmitted;
      var onend = /* @__PURE__ */ __name(function onend2() {
        readable = false;
        readableEnded = true;
        if (!writable) callback.call(stream);
      }, "onend");
      var onerror = /* @__PURE__ */ __name(function onerror2(err) {
        callback.call(stream, err);
      }, "onerror");
      var onclose = /* @__PURE__ */ __name(function onclose2() {
        var err;
        if (readable && !readableEnded) {
          if (!stream._readableState || !stream._readableState.ended) err = new ERR_STREAM_PREMATURE_CLOSE();
          return callback.call(stream, err);
        }
        if (writable && !writableEnded) {
          if (!stream._writableState || !stream._writableState.ended) err = new ERR_STREAM_PREMATURE_CLOSE();
          return callback.call(stream, err);
        }
      }, "onclose");
      var onrequest = /* @__PURE__ */ __name(function onrequest2() {
        stream.req.on("finish", onfinish);
      }, "onrequest");
      if (isRequest(stream)) {
        stream.on("complete", onfinish);
        stream.on("abort", onclose);
        if (stream.req) onrequest();
        else stream.on("request", onrequest);
      } else if (writable && !stream._writableState) {
        stream.on("end", onlegacyfinish);
        stream.on("close", onlegacyfinish);
      }
      stream.on("end", onend);
      stream.on("finish", onfinish);
      if (opts.error !== false) stream.on("error", onerror);
      stream.on("close", onclose);
      return function() {
        stream.removeListener("complete", onfinish);
        stream.removeListener("abort", onclose);
        stream.removeListener("request", onrequest);
        if (stream.req) stream.req.removeListener("finish", onfinish);
        stream.removeListener("end", onlegacyfinish);
        stream.removeListener("close", onlegacyfinish);
        stream.removeListener("finish", onfinish);
        stream.removeListener("end", onend);
        stream.removeListener("error", onerror);
        stream.removeListener("close", onclose);
      };
    }
    __name(eos, "eos");
    module2.exports = eos;
  }
});

// node_modules/winston-transport/node_modules/readable-stream/lib/internal/streams/async_iterator.js
var require_async_iterator = __commonJS({
  "node_modules/winston-transport/node_modules/readable-stream/lib/internal/streams/async_iterator.js"(exports2, module2) {
    "use strict";
    var _Object$setPrototypeO;
    function _defineProperty(obj, key, value) {
      key = _toPropertyKey(key);
      if (key in obj) {
        Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
      } else {
        obj[key] = value;
      }
      return obj;
    }
    __name(_defineProperty, "_defineProperty");
    function _toPropertyKey(arg) {
      var key = _toPrimitive(arg, "string");
      return typeof key === "symbol" ? key : String(key);
    }
    __name(_toPropertyKey, "_toPropertyKey");
    function _toPrimitive(input, hint) {
      if (typeof input !== "object" || input === null) return input;
      var prim = input[Symbol.toPrimitive];
      if (prim !== void 0) {
        var res = prim.call(input, hint || "default");
        if (typeof res !== "object") return res;
        throw new TypeError("@@toPrimitive must return a primitive value.");
      }
      return (hint === "string" ? String : Number)(input);
    }
    __name(_toPrimitive, "_toPrimitive");
    var finished = require_end_of_stream();
    var kLastResolve = /* @__PURE__ */ Symbol("lastResolve");
    var kLastReject = /* @__PURE__ */ Symbol("lastReject");
    var kError = /* @__PURE__ */ Symbol("error");
    var kEnded = /* @__PURE__ */ Symbol("ended");
    var kLastPromise = /* @__PURE__ */ Symbol("lastPromise");
    var kHandlePromise = /* @__PURE__ */ Symbol("handlePromise");
    var kStream = /* @__PURE__ */ Symbol("stream");
    function createIterResult(value, done) {
      return {
        value,
        done
      };
    }
    __name(createIterResult, "createIterResult");
    function readAndResolve(iter) {
      var resolve = iter[kLastResolve];
      if (resolve !== null) {
        var data = iter[kStream].read();
        if (data !== null) {
          iter[kLastPromise] = null;
          iter[kLastResolve] = null;
          iter[kLastReject] = null;
          resolve(createIterResult(data, false));
        }
      }
    }
    __name(readAndResolve, "readAndResolve");
    function onReadable(iter) {
      process.nextTick(readAndResolve, iter);
    }
    __name(onReadable, "onReadable");
    function wrapForNext(lastPromise, iter) {
      return function(resolve, reject) {
        lastPromise.then(function() {
          if (iter[kEnded]) {
            resolve(createIterResult(void 0, true));
            return;
          }
          iter[kHandlePromise](resolve, reject);
        }, reject);
      };
    }
    __name(wrapForNext, "wrapForNext");
    var AsyncIteratorPrototype = Object.getPrototypeOf(function() {
    });
    var ReadableStreamAsyncIteratorPrototype = Object.setPrototypeOf((_Object$setPrototypeO = {
      get stream() {
        return this[kStream];
      },
      next: /* @__PURE__ */ __name(function next() {
        var _this = this;
        var error = this[kError];
        if (error !== null) {
          return Promise.reject(error);
        }
        if (this[kEnded]) {
          return Promise.resolve(createIterResult(void 0, true));
        }
        if (this[kStream].destroyed) {
          return new Promise(function(resolve, reject) {
            process.nextTick(function() {
              if (_this[kError]) {
                reject(_this[kError]);
              } else {
                resolve(createIterResult(void 0, true));
              }
            });
          });
        }
        var lastPromise = this[kLastPromise];
        var promise;
        if (lastPromise) {
          promise = new Promise(wrapForNext(lastPromise, this));
        } else {
          var data = this[kStream].read();
          if (data !== null) {
            return Promise.resolve(createIterResult(data, false));
          }
          promise = new Promise(this[kHandlePromise]);
        }
        this[kLastPromise] = promise;
        return promise;
      }, "next")
    }, _defineProperty(_Object$setPrototypeO, Symbol.asyncIterator, function() {
      return this;
    }), _defineProperty(_Object$setPrototypeO, "return", /* @__PURE__ */ __name(function _return() {
      var _this2 = this;
      return new Promise(function(resolve, reject) {
        _this2[kStream].destroy(null, function(err) {
          if (err) {
            reject(err);
            return;
          }
          resolve(createIterResult(void 0, true));
        });
      });
    }, "_return")), _Object$setPrototypeO), AsyncIteratorPrototype);
    var createReadableStreamAsyncIterator = /* @__PURE__ */ __name(function createReadableStreamAsyncIterator2(stream) {
      var _Object$create;
      var iterator = Object.create(ReadableStreamAsyncIteratorPrototype, (_Object$create = {}, _defineProperty(_Object$create, kStream, {
        value: stream,
        writable: true
      }), _defineProperty(_Object$create, kLastResolve, {
        value: null,
        writable: true
      }), _defineProperty(_Object$create, kLastReject, {
        value: null,
        writable: true
      }), _defineProperty(_Object$create, kError, {
        value: null,
        writable: true
      }), _defineProperty(_Object$create, kEnded, {
        value: stream._readableState.endEmitted,
        writable: true
      }), _defineProperty(_Object$create, kHandlePromise, {
        value: /* @__PURE__ */ __name(function value(resolve, reject) {
          var data = iterator[kStream].read();
          if (data) {
            iterator[kLastPromise] = null;
            iterator[kLastResolve] = null;
            iterator[kLastReject] = null;
            resolve(createIterResult(data, false));
          } else {
            iterator[kLastResolve] = resolve;
            iterator[kLastReject] = reject;
          }
        }, "value"),
        writable: true
      }), _Object$create));
      iterator[kLastPromise] = null;
      finished(stream, function(err) {
        if (err && err.code !== "ERR_STREAM_PREMATURE_CLOSE") {
          var reject = iterator[kLastReject];
          if (reject !== null) {
            iterator[kLastPromise] = null;
            iterator[kLastResolve] = null;
            iterator[kLastReject] = null;
            reject(err);
          }
          iterator[kError] = err;
          return;
        }
        var resolve = iterator[kLastResolve];
        if (resolve !== null) {
          iterator[kLastPromise] = null;
          iterator[kLastResolve] = null;
          iterator[kLastReject] = null;
          resolve(createIterResult(void 0, true));
        }
        iterator[kEnded] = true;
      });
      stream.on("readable", onReadable.bind(null, iterator));
      return iterator;
    }, "createReadableStreamAsyncIterator");
    module2.exports = createReadableStreamAsyncIterator;
  }
});

// node_modules/winston-transport/node_modules/readable-stream/lib/internal/streams/from.js
var require_from = __commonJS({
  "node_modules/winston-transport/node_modules/readable-stream/lib/internal/streams/from.js"(exports2, module2) {
    "use strict";
    function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
      try {
        var info = gen[key](arg);
        var value = info.value;
      } catch (error) {
        reject(error);
        return;
      }
      if (info.done) {
        resolve(value);
      } else {
        Promise.resolve(value).then(_next, _throw);
      }
    }
    __name(asyncGeneratorStep, "asyncGeneratorStep");
    function _asyncToGenerator(fn) {
      return function() {
        var self2 = this, args = arguments;
        return new Promise(function(resolve, reject) {
          var gen = fn.apply(self2, args);
          function _next(value) {
            asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
          }
          __name(_next, "_next");
          function _throw(err) {
            asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
          }
          __name(_throw, "_throw");
          _next(void 0);
        });
      };
    }
    __name(_asyncToGenerator, "_asyncToGenerator");
    function ownKeys(object, enumerableOnly) {
      var keys = Object.keys(object);
      if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        enumerableOnly && (symbols = symbols.filter(function(sym) {
          return Object.getOwnPropertyDescriptor(object, sym).enumerable;
        })), keys.push.apply(keys, symbols);
      }
      return keys;
    }
    __name(ownKeys, "ownKeys");
    function _objectSpread(target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = null != arguments[i] ? arguments[i] : {};
        i % 2 ? ownKeys(Object(source), true).forEach(function(key) {
          _defineProperty(target, key, source[key]);
        }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function(key) {
          Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
      }
      return target;
    }
    __name(_objectSpread, "_objectSpread");
    function _defineProperty(obj, key, value) {
      key = _toPropertyKey(key);
      if (key in obj) {
        Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
      } else {
        obj[key] = value;
      }
      return obj;
    }
    __name(_defineProperty, "_defineProperty");
    function _toPropertyKey(arg) {
      var key = _toPrimitive(arg, "string");
      return typeof key === "symbol" ? key : String(key);
    }
    __name(_toPropertyKey, "_toPropertyKey");
    function _toPrimitive(input, hint) {
      if (typeof input !== "object" || input === null) return input;
      var prim = input[Symbol.toPrimitive];
      if (prim !== void 0) {
        var res = prim.call(input, hint || "default");
        if (typeof res !== "object") return res;
        throw new TypeError("@@toPrimitive must return a primitive value.");
      }
      return (hint === "string" ? String : Number)(input);
    }
    __name(_toPrimitive, "_toPrimitive");
    var ERR_INVALID_ARG_TYPE = require_errors2().codes.ERR_INVALID_ARG_TYPE;
    function from(Readable, iterable, opts) {
      var iterator;
      if (iterable && typeof iterable.next === "function") {
        iterator = iterable;
      } else if (iterable && iterable[Symbol.asyncIterator]) iterator = iterable[Symbol.asyncIterator]();
      else if (iterable && iterable[Symbol.iterator]) iterator = iterable[Symbol.iterator]();
      else throw new ERR_INVALID_ARG_TYPE("iterable", ["Iterable"], iterable);
      var readable = new Readable(_objectSpread({
        objectMode: true
      }, opts));
      var reading = false;
      readable._read = function() {
        if (!reading) {
          reading = true;
          next();
        }
      };
      function next() {
        return _next2.apply(this, arguments);
      }
      __name(next, "next");
      function _next2() {
        _next2 = _asyncToGenerator(function* () {
          try {
            var _yield$iterator$next = yield iterator.next(), value = _yield$iterator$next.value, done = _yield$iterator$next.done;
            if (done) {
              readable.push(null);
            } else if (readable.push(yield value)) {
              next();
            } else {
              reading = false;
            }
          } catch (err) {
            readable.destroy(err);
          }
        });
        return _next2.apply(this, arguments);
      }
      __name(_next2, "_next2");
      return readable;
    }
    __name(from, "from");
    module2.exports = from;
  }
});

// node_modules/winston-transport/node_modules/readable-stream/lib/_stream_readable.js
var require_stream_readable = __commonJS({
  "node_modules/winston-transport/node_modules/readable-stream/lib/_stream_readable.js"(exports2, module2) {
    "use strict";
    module2.exports = Readable;
    var Duplex;
    Readable.ReadableState = ReadableState;
    var EE = require("events").EventEmitter;
    var EElistenerCount = /* @__PURE__ */ __name(function EElistenerCount2(emitter, type) {
      return emitter.listeners(type).length;
    }, "EElistenerCount");
    var Stream = require_stream();
    var Buffer2 = require("buffer").Buffer;
    var OurUint8Array = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : {}).Uint8Array || function() {
    };
    function _uint8ArrayToBuffer(chunk) {
      return Buffer2.from(chunk);
    }
    __name(_uint8ArrayToBuffer, "_uint8ArrayToBuffer");
    function _isUint8Array(obj) {
      return Buffer2.isBuffer(obj) || obj instanceof OurUint8Array;
    }
    __name(_isUint8Array, "_isUint8Array");
    var debugUtil = require("util");
    var debug;
    if (debugUtil && debugUtil.debuglog) {
      debug = debugUtil.debuglog("stream");
    } else {
      debug = /* @__PURE__ */ __name(function debug2() {
      }, "debug");
    }
    var BufferList = require_buffer_list();
    var destroyImpl = require_destroy();
    var _require = require_state();
    var getHighWaterMark = _require.getHighWaterMark;
    var _require$codes = require_errors2().codes;
    var ERR_INVALID_ARG_TYPE = _require$codes.ERR_INVALID_ARG_TYPE;
    var ERR_STREAM_PUSH_AFTER_EOF = _require$codes.ERR_STREAM_PUSH_AFTER_EOF;
    var ERR_METHOD_NOT_IMPLEMENTED = _require$codes.ERR_METHOD_NOT_IMPLEMENTED;
    var ERR_STREAM_UNSHIFT_AFTER_END_EVENT = _require$codes.ERR_STREAM_UNSHIFT_AFTER_END_EVENT;
    var StringDecoder;
    var createReadableStreamAsyncIterator;
    var from;
    require_inherits()(Readable, Stream);
    var errorOrDestroy = destroyImpl.errorOrDestroy;
    var kProxyEvents = ["error", "close", "destroy", "pause", "resume"];
    function prependListener(emitter, event, fn) {
      if (typeof emitter.prependListener === "function") return emitter.prependListener(event, fn);
      if (!emitter._events || !emitter._events[event]) emitter.on(event, fn);
      else if (Array.isArray(emitter._events[event])) emitter._events[event].unshift(fn);
      else emitter._events[event] = [fn, emitter._events[event]];
    }
    __name(prependListener, "prependListener");
    function ReadableState(options, stream, isDuplex) {
      Duplex = Duplex || require_stream_duplex();
      options = options || {};
      if (typeof isDuplex !== "boolean") isDuplex = stream instanceof Duplex;
      this.objectMode = !!options.objectMode;
      if (isDuplex) this.objectMode = this.objectMode || !!options.readableObjectMode;
      this.highWaterMark = getHighWaterMark(this, options, "readableHighWaterMark", isDuplex);
      this.buffer = new BufferList();
      this.length = 0;
      this.pipes = null;
      this.pipesCount = 0;
      this.flowing = null;
      this.ended = false;
      this.endEmitted = false;
      this.reading = false;
      this.sync = true;
      this.needReadable = false;
      this.emittedReadable = false;
      this.readableListening = false;
      this.resumeScheduled = false;
      this.paused = true;
      this.emitClose = options.emitClose !== false;
      this.autoDestroy = !!options.autoDestroy;
      this.destroyed = false;
      this.defaultEncoding = options.defaultEncoding || "utf8";
      this.awaitDrain = 0;
      this.readingMore = false;
      this.decoder = null;
      this.encoding = null;
      if (options.encoding) {
        if (!StringDecoder) StringDecoder = require_string_decoder().StringDecoder;
        this.decoder = new StringDecoder(options.encoding);
        this.encoding = options.encoding;
      }
    }
    __name(ReadableState, "ReadableState");
    function Readable(options) {
      Duplex = Duplex || require_stream_duplex();
      if (!(this instanceof Readable)) return new Readable(options);
      var isDuplex = this instanceof Duplex;
      this._readableState = new ReadableState(options, this, isDuplex);
      this.readable = true;
      if (options) {
        if (typeof options.read === "function") this._read = options.read;
        if (typeof options.destroy === "function") this._destroy = options.destroy;
      }
      Stream.call(this);
    }
    __name(Readable, "Readable");
    Object.defineProperty(Readable.prototype, "destroyed", {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: /* @__PURE__ */ __name(function get() {
        if (this._readableState === void 0) {
          return false;
        }
        return this._readableState.destroyed;
      }, "get"),
      set: /* @__PURE__ */ __name(function set(value) {
        if (!this._readableState) {
          return;
        }
        this._readableState.destroyed = value;
      }, "set")
    });
    Readable.prototype.destroy = destroyImpl.destroy;
    Readable.prototype._undestroy = destroyImpl.undestroy;
    Readable.prototype._destroy = function(err, cb) {
      cb(err);
    };
    Readable.prototype.push = function(chunk, encoding) {
      var state2 = this._readableState;
      var skipChunkCheck;
      if (!state2.objectMode) {
        if (typeof chunk === "string") {
          encoding = encoding || state2.defaultEncoding;
          if (encoding !== state2.encoding) {
            chunk = Buffer2.from(chunk, encoding);
            encoding = "";
          }
          skipChunkCheck = true;
        }
      } else {
        skipChunkCheck = true;
      }
      return readableAddChunk(this, chunk, encoding, false, skipChunkCheck);
    };
    Readable.prototype.unshift = function(chunk) {
      return readableAddChunk(this, chunk, null, true, false);
    };
    function readableAddChunk(stream, chunk, encoding, addToFront, skipChunkCheck) {
      debug("readableAddChunk", chunk);
      var state2 = stream._readableState;
      if (chunk === null) {
        state2.reading = false;
        onEofChunk(stream, state2);
      } else {
        var er;
        if (!skipChunkCheck) er = chunkInvalid(state2, chunk);
        if (er) {
          errorOrDestroy(stream, er);
        } else if (state2.objectMode || chunk && chunk.length > 0) {
          if (typeof chunk !== "string" && !state2.objectMode && Object.getPrototypeOf(chunk) !== Buffer2.prototype) {
            chunk = _uint8ArrayToBuffer(chunk);
          }
          if (addToFront) {
            if (state2.endEmitted) errorOrDestroy(stream, new ERR_STREAM_UNSHIFT_AFTER_END_EVENT());
            else addChunk(stream, state2, chunk, true);
          } else if (state2.ended) {
            errorOrDestroy(stream, new ERR_STREAM_PUSH_AFTER_EOF());
          } else if (state2.destroyed) {
            return false;
          } else {
            state2.reading = false;
            if (state2.decoder && !encoding) {
              chunk = state2.decoder.write(chunk);
              if (state2.objectMode || chunk.length !== 0) addChunk(stream, state2, chunk, false);
              else maybeReadMore(stream, state2);
            } else {
              addChunk(stream, state2, chunk, false);
            }
          }
        } else if (!addToFront) {
          state2.reading = false;
          maybeReadMore(stream, state2);
        }
      }
      return !state2.ended && (state2.length < state2.highWaterMark || state2.length === 0);
    }
    __name(readableAddChunk, "readableAddChunk");
    function addChunk(stream, state2, chunk, addToFront) {
      if (state2.flowing && state2.length === 0 && !state2.sync) {
        state2.awaitDrain = 0;
        stream.emit("data", chunk);
      } else {
        state2.length += state2.objectMode ? 1 : chunk.length;
        if (addToFront) state2.buffer.unshift(chunk);
        else state2.buffer.push(chunk);
        if (state2.needReadable) emitReadable(stream);
      }
      maybeReadMore(stream, state2);
    }
    __name(addChunk, "addChunk");
    function chunkInvalid(state2, chunk) {
      var er;
      if (!_isUint8Array(chunk) && typeof chunk !== "string" && chunk !== void 0 && !state2.objectMode) {
        er = new ERR_INVALID_ARG_TYPE("chunk", ["string", "Buffer", "Uint8Array"], chunk);
      }
      return er;
    }
    __name(chunkInvalid, "chunkInvalid");
    Readable.prototype.isPaused = function() {
      return this._readableState.flowing === false;
    };
    Readable.prototype.setEncoding = function(enc) {
      if (!StringDecoder) StringDecoder = require_string_decoder().StringDecoder;
      var decoder = new StringDecoder(enc);
      this._readableState.decoder = decoder;
      this._readableState.encoding = this._readableState.decoder.encoding;
      var p = this._readableState.buffer.head;
      var content = "";
      while (p !== null) {
        content += decoder.write(p.data);
        p = p.next;
      }
      this._readableState.buffer.clear();
      if (content !== "") this._readableState.buffer.push(content);
      this._readableState.length = content.length;
      return this;
    };
    var MAX_HWM = 1073741824;
    function computeNewHighWaterMark(n) {
      if (n >= MAX_HWM) {
        n = MAX_HWM;
      } else {
        n--;
        n |= n >>> 1;
        n |= n >>> 2;
        n |= n >>> 4;
        n |= n >>> 8;
        n |= n >>> 16;
        n++;
      }
      return n;
    }
    __name(computeNewHighWaterMark, "computeNewHighWaterMark");
    function howMuchToRead(n, state2) {
      if (n <= 0 || state2.length === 0 && state2.ended) return 0;
      if (state2.objectMode) return 1;
      if (n !== n) {
        if (state2.flowing && state2.length) return state2.buffer.head.data.length;
        else return state2.length;
      }
      if (n > state2.highWaterMark) state2.highWaterMark = computeNewHighWaterMark(n);
      if (n <= state2.length) return n;
      if (!state2.ended) {
        state2.needReadable = true;
        return 0;
      }
      return state2.length;
    }
    __name(howMuchToRead, "howMuchToRead");
    Readable.prototype.read = function(n) {
      debug("read", n);
      n = parseInt(n, 10);
      var state2 = this._readableState;
      var nOrig = n;
      if (n !== 0) state2.emittedReadable = false;
      if (n === 0 && state2.needReadable && ((state2.highWaterMark !== 0 ? state2.length >= state2.highWaterMark : state2.length > 0) || state2.ended)) {
        debug("read: emitReadable", state2.length, state2.ended);
        if (state2.length === 0 && state2.ended) endReadable(this);
        else emitReadable(this);
        return null;
      }
      n = howMuchToRead(n, state2);
      if (n === 0 && state2.ended) {
        if (state2.length === 0) endReadable(this);
        return null;
      }
      var doRead = state2.needReadable;
      debug("need readable", doRead);
      if (state2.length === 0 || state2.length - n < state2.highWaterMark) {
        doRead = true;
        debug("length less than watermark", doRead);
      }
      if (state2.ended || state2.reading) {
        doRead = false;
        debug("reading or ended", doRead);
      } else if (doRead) {
        debug("do read");
        state2.reading = true;
        state2.sync = true;
        if (state2.length === 0) state2.needReadable = true;
        this._read(state2.highWaterMark);
        state2.sync = false;
        if (!state2.reading) n = howMuchToRead(nOrig, state2);
      }
      var ret;
      if (n > 0) ret = fromList(n, state2);
      else ret = null;
      if (ret === null) {
        state2.needReadable = state2.length <= state2.highWaterMark;
        n = 0;
      } else {
        state2.length -= n;
        state2.awaitDrain = 0;
      }
      if (state2.length === 0) {
        if (!state2.ended) state2.needReadable = true;
        if (nOrig !== n && state2.ended) endReadable(this);
      }
      if (ret !== null) this.emit("data", ret);
      return ret;
    };
    function onEofChunk(stream, state2) {
      debug("onEofChunk");
      if (state2.ended) return;
      if (state2.decoder) {
        var chunk = state2.decoder.end();
        if (chunk && chunk.length) {
          state2.buffer.push(chunk);
          state2.length += state2.objectMode ? 1 : chunk.length;
        }
      }
      state2.ended = true;
      if (state2.sync) {
        emitReadable(stream);
      } else {
        state2.needReadable = false;
        if (!state2.emittedReadable) {
          state2.emittedReadable = true;
          emitReadable_(stream);
        }
      }
    }
    __name(onEofChunk, "onEofChunk");
    function emitReadable(stream) {
      var state2 = stream._readableState;
      debug("emitReadable", state2.needReadable, state2.emittedReadable);
      state2.needReadable = false;
      if (!state2.emittedReadable) {
        debug("emitReadable", state2.flowing);
        state2.emittedReadable = true;
        process.nextTick(emitReadable_, stream);
      }
    }
    __name(emitReadable, "emitReadable");
    function emitReadable_(stream) {
      var state2 = stream._readableState;
      debug("emitReadable_", state2.destroyed, state2.length, state2.ended);
      if (!state2.destroyed && (state2.length || state2.ended)) {
        stream.emit("readable");
        state2.emittedReadable = false;
      }
      state2.needReadable = !state2.flowing && !state2.ended && state2.length <= state2.highWaterMark;
      flow(stream);
    }
    __name(emitReadable_, "emitReadable_");
    function maybeReadMore(stream, state2) {
      if (!state2.readingMore) {
        state2.readingMore = true;
        process.nextTick(maybeReadMore_, stream, state2);
      }
    }
    __name(maybeReadMore, "maybeReadMore");
    function maybeReadMore_(stream, state2) {
      while (!state2.reading && !state2.ended && (state2.length < state2.highWaterMark || state2.flowing && state2.length === 0)) {
        var len = state2.length;
        debug("maybeReadMore read 0");
        stream.read(0);
        if (len === state2.length)
          break;
      }
      state2.readingMore = false;
    }
    __name(maybeReadMore_, "maybeReadMore_");
    Readable.prototype._read = function(n) {
      errorOrDestroy(this, new ERR_METHOD_NOT_IMPLEMENTED("_read()"));
    };
    Readable.prototype.pipe = function(dest, pipeOpts) {
      var src = this;
      var state2 = this._readableState;
      switch (state2.pipesCount) {
        case 0:
          state2.pipes = dest;
          break;
        case 1:
          state2.pipes = [state2.pipes, dest];
          break;
        default:
          state2.pipes.push(dest);
          break;
      }
      state2.pipesCount += 1;
      debug("pipe count=%d opts=%j", state2.pipesCount, pipeOpts);
      var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;
      var endFn = doEnd ? onend : unpipe;
      if (state2.endEmitted) process.nextTick(endFn);
      else src.once("end", endFn);
      dest.on("unpipe", onunpipe);
      function onunpipe(readable, unpipeInfo) {
        debug("onunpipe");
        if (readable === src) {
          if (unpipeInfo && unpipeInfo.hasUnpiped === false) {
            unpipeInfo.hasUnpiped = true;
            cleanup();
          }
        }
      }
      __name(onunpipe, "onunpipe");
      function onend() {
        debug("onend");
        dest.end();
      }
      __name(onend, "onend");
      var ondrain = pipeOnDrain(src);
      dest.on("drain", ondrain);
      var cleanedUp = false;
      function cleanup() {
        debug("cleanup");
        dest.removeListener("close", onclose);
        dest.removeListener("finish", onfinish);
        dest.removeListener("drain", ondrain);
        dest.removeListener("error", onerror);
        dest.removeListener("unpipe", onunpipe);
        src.removeListener("end", onend);
        src.removeListener("end", unpipe);
        src.removeListener("data", ondata);
        cleanedUp = true;
        if (state2.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
      }
      __name(cleanup, "cleanup");
      src.on("data", ondata);
      function ondata(chunk) {
        debug("ondata");
        var ret = dest.write(chunk);
        debug("dest.write", ret);
        if (ret === false) {
          if ((state2.pipesCount === 1 && state2.pipes === dest || state2.pipesCount > 1 && indexOf(state2.pipes, dest) !== -1) && !cleanedUp) {
            debug("false write response, pause", state2.awaitDrain);
            state2.awaitDrain++;
          }
          src.pause();
        }
      }
      __name(ondata, "ondata");
      function onerror(er) {
        debug("onerror", er);
        unpipe();
        dest.removeListener("error", onerror);
        if (EElistenerCount(dest, "error") === 0) errorOrDestroy(dest, er);
      }
      __name(onerror, "onerror");
      prependListener(dest, "error", onerror);
      function onclose() {
        dest.removeListener("finish", onfinish);
        unpipe();
      }
      __name(onclose, "onclose");
      dest.once("close", onclose);
      function onfinish() {
        debug("onfinish");
        dest.removeListener("close", onclose);
        unpipe();
      }
      __name(onfinish, "onfinish");
      dest.once("finish", onfinish);
      function unpipe() {
        debug("unpipe");
        src.unpipe(dest);
      }
      __name(unpipe, "unpipe");
      dest.emit("pipe", src);
      if (!state2.flowing) {
        debug("pipe resume");
        src.resume();
      }
      return dest;
    };
    function pipeOnDrain(src) {
      return /* @__PURE__ */ __name(function pipeOnDrainFunctionResult() {
        var state2 = src._readableState;
        debug("pipeOnDrain", state2.awaitDrain);
        if (state2.awaitDrain) state2.awaitDrain--;
        if (state2.awaitDrain === 0 && EElistenerCount(src, "data")) {
          state2.flowing = true;
          flow(src);
        }
      }, "pipeOnDrainFunctionResult");
    }
    __name(pipeOnDrain, "pipeOnDrain");
    Readable.prototype.unpipe = function(dest) {
      var state2 = this._readableState;
      var unpipeInfo = {
        hasUnpiped: false
      };
      if (state2.pipesCount === 0) return this;
      if (state2.pipesCount === 1) {
        if (dest && dest !== state2.pipes) return this;
        if (!dest) dest = state2.pipes;
        state2.pipes = null;
        state2.pipesCount = 0;
        state2.flowing = false;
        if (dest) dest.emit("unpipe", this, unpipeInfo);
        return this;
      }
      if (!dest) {
        var dests = state2.pipes;
        var len = state2.pipesCount;
        state2.pipes = null;
        state2.pipesCount = 0;
        state2.flowing = false;
        for (var i = 0; i < len; i++) dests[i].emit("unpipe", this, {
          hasUnpiped: false
        });
        return this;
      }
      var index = indexOf(state2.pipes, dest);
      if (index === -1) return this;
      state2.pipes.splice(index, 1);
      state2.pipesCount -= 1;
      if (state2.pipesCount === 1) state2.pipes = state2.pipes[0];
      dest.emit("unpipe", this, unpipeInfo);
      return this;
    };
    Readable.prototype.on = function(ev, fn) {
      var res = Stream.prototype.on.call(this, ev, fn);
      var state2 = this._readableState;
      if (ev === "data") {
        state2.readableListening = this.listenerCount("readable") > 0;
        if (state2.flowing !== false) this.resume();
      } else if (ev === "readable") {
        if (!state2.endEmitted && !state2.readableListening) {
          state2.readableListening = state2.needReadable = true;
          state2.flowing = false;
          state2.emittedReadable = false;
          debug("on readable", state2.length, state2.reading);
          if (state2.length) {
            emitReadable(this);
          } else if (!state2.reading) {
            process.nextTick(nReadingNextTick, this);
          }
        }
      }
      return res;
    };
    Readable.prototype.addListener = Readable.prototype.on;
    Readable.prototype.removeListener = function(ev, fn) {
      var res = Stream.prototype.removeListener.call(this, ev, fn);
      if (ev === "readable") {
        process.nextTick(updateReadableListening, this);
      }
      return res;
    };
    Readable.prototype.removeAllListeners = function(ev) {
      var res = Stream.prototype.removeAllListeners.apply(this, arguments);
      if (ev === "readable" || ev === void 0) {
        process.nextTick(updateReadableListening, this);
      }
      return res;
    };
    function updateReadableListening(self2) {
      var state2 = self2._readableState;
      state2.readableListening = self2.listenerCount("readable") > 0;
      if (state2.resumeScheduled && !state2.paused) {
        state2.flowing = true;
      } else if (self2.listenerCount("data") > 0) {
        self2.resume();
      }
    }
    __name(updateReadableListening, "updateReadableListening");
    function nReadingNextTick(self2) {
      debug("readable nexttick read 0");
      self2.read(0);
    }
    __name(nReadingNextTick, "nReadingNextTick");
    Readable.prototype.resume = function() {
      var state2 = this._readableState;
      if (!state2.flowing) {
        debug("resume");
        state2.flowing = !state2.readableListening;
        resume(this, state2);
      }
      state2.paused = false;
      return this;
    };
    function resume(stream, state2) {
      if (!state2.resumeScheduled) {
        state2.resumeScheduled = true;
        process.nextTick(resume_, stream, state2);
      }
    }
    __name(resume, "resume");
    function resume_(stream, state2) {
      debug("resume", state2.reading);
      if (!state2.reading) {
        stream.read(0);
      }
      state2.resumeScheduled = false;
      stream.emit("resume");
      flow(stream);
      if (state2.flowing && !state2.reading) stream.read(0);
    }
    __name(resume_, "resume_");
    Readable.prototype.pause = function() {
      debug("call pause flowing=%j", this._readableState.flowing);
      if (this._readableState.flowing !== false) {
        debug("pause");
        this._readableState.flowing = false;
        this.emit("pause");
      }
      this._readableState.paused = true;
      return this;
    };
    function flow(stream) {
      var state2 = stream._readableState;
      debug("flow", state2.flowing);
      while (state2.flowing && stream.read() !== null) ;
    }
    __name(flow, "flow");
    Readable.prototype.wrap = function(stream) {
      var _this = this;
      var state2 = this._readableState;
      var paused = false;
      stream.on("end", function() {
        debug("wrapped end");
        if (state2.decoder && !state2.ended) {
          var chunk = state2.decoder.end();
          if (chunk && chunk.length) _this.push(chunk);
        }
        _this.push(null);
      });
      stream.on("data", function(chunk) {
        debug("wrapped data");
        if (state2.decoder) chunk = state2.decoder.write(chunk);
        if (state2.objectMode && (chunk === null || chunk === void 0)) return;
        else if (!state2.objectMode && (!chunk || !chunk.length)) return;
        var ret = _this.push(chunk);
        if (!ret) {
          paused = true;
          stream.pause();
        }
      });
      for (var i in stream) {
        if (this[i] === void 0 && typeof stream[i] === "function") {
          this[i] = (/* @__PURE__ */ __name(function methodWrap(method) {
            return /* @__PURE__ */ __name(function methodWrapReturnFunction() {
              return stream[method].apply(stream, arguments);
            }, "methodWrapReturnFunction");
          }, "methodWrap"))(i);
        }
      }
      for (var n = 0; n < kProxyEvents.length; n++) {
        stream.on(kProxyEvents[n], this.emit.bind(this, kProxyEvents[n]));
      }
      this._read = function(n2) {
        debug("wrapped _read", n2);
        if (paused) {
          paused = false;
          stream.resume();
        }
      };
      return this;
    };
    if (typeof Symbol === "function") {
      Readable.prototype[Symbol.asyncIterator] = function() {
        if (createReadableStreamAsyncIterator === void 0) {
          createReadableStreamAsyncIterator = require_async_iterator();
        }
        return createReadableStreamAsyncIterator(this);
      };
    }
    Object.defineProperty(Readable.prototype, "readableHighWaterMark", {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: /* @__PURE__ */ __name(function get() {
        return this._readableState.highWaterMark;
      }, "get")
    });
    Object.defineProperty(Readable.prototype, "readableBuffer", {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: /* @__PURE__ */ __name(function get() {
        return this._readableState && this._readableState.buffer;
      }, "get")
    });
    Object.defineProperty(Readable.prototype, "readableFlowing", {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: /* @__PURE__ */ __name(function get() {
        return this._readableState.flowing;
      }, "get"),
      set: /* @__PURE__ */ __name(function set(state2) {
        if (this._readableState) {
          this._readableState.flowing = state2;
        }
      }, "set")
    });
    Readable._fromList = fromList;
    Object.defineProperty(Readable.prototype, "readableLength", {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: /* @__PURE__ */ __name(function get() {
        return this._readableState.length;
      }, "get")
    });
    function fromList(n, state2) {
      if (state2.length === 0) return null;
      var ret;
      if (state2.objectMode) ret = state2.buffer.shift();
      else if (!n || n >= state2.length) {
        if (state2.decoder) ret = state2.buffer.join("");
        else if (state2.buffer.length === 1) ret = state2.buffer.first();
        else ret = state2.buffer.concat(state2.length);
        state2.buffer.clear();
      } else {
        ret = state2.buffer.consume(n, state2.decoder);
      }
      return ret;
    }
    __name(fromList, "fromList");
    function endReadable(stream) {
      var state2 = stream._readableState;
      debug("endReadable", state2.endEmitted);
      if (!state2.endEmitted) {
        state2.ended = true;
        process.nextTick(endReadableNT, state2, stream);
      }
    }
    __name(endReadable, "endReadable");
    function endReadableNT(state2, stream) {
      debug("endReadableNT", state2.endEmitted, state2.length);
      if (!state2.endEmitted && state2.length === 0) {
        state2.endEmitted = true;
        stream.readable = false;
        stream.emit("end");
        if (state2.autoDestroy) {
          var wState = stream._writableState;
          if (!wState || wState.autoDestroy && wState.finished) {
            stream.destroy();
          }
        }
      }
    }
    __name(endReadableNT, "endReadableNT");
    if (typeof Symbol === "function") {
      Readable.from = function(iterable, opts) {
        if (from === void 0) {
          from = require_from();
        }
        return from(Readable, iterable, opts);
      };
    }
    function indexOf(xs, x) {
      for (var i = 0, l = xs.length; i < l; i++) {
        if (xs[i] === x) return i;
      }
      return -1;
    }
    __name(indexOf, "indexOf");
  }
});

// node_modules/winston-transport/node_modules/readable-stream/lib/_stream_duplex.js
var require_stream_duplex = __commonJS({
  "node_modules/winston-transport/node_modules/readable-stream/lib/_stream_duplex.js"(exports2, module2) {
    "use strict";
    var objectKeys = Object.keys || function(obj) {
      var keys2 = [];
      for (var key in obj) keys2.push(key);
      return keys2;
    };
    module2.exports = Duplex;
    var Readable = require_stream_readable();
    var Writable = require_stream_writable();
    require_inherits()(Duplex, Readable);
    {
      keys = objectKeys(Writable.prototype);
      for (v = 0; v < keys.length; v++) {
        method = keys[v];
        if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
      }
    }
    var keys;
    var method;
    var v;
    function Duplex(options) {
      if (!(this instanceof Duplex)) return new Duplex(options);
      Readable.call(this, options);
      Writable.call(this, options);
      this.allowHalfOpen = true;
      if (options) {
        if (options.readable === false) this.readable = false;
        if (options.writable === false) this.writable = false;
        if (options.allowHalfOpen === false) {
          this.allowHalfOpen = false;
          this.once("end", onend);
        }
      }
    }
    __name(Duplex, "Duplex");
    Object.defineProperty(Duplex.prototype, "writableHighWaterMark", {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: /* @__PURE__ */ __name(function get() {
        return this._writableState.highWaterMark;
      }, "get")
    });
    Object.defineProperty(Duplex.prototype, "writableBuffer", {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: /* @__PURE__ */ __name(function get() {
        return this._writableState && this._writableState.getBuffer();
      }, "get")
    });
    Object.defineProperty(Duplex.prototype, "writableLength", {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: /* @__PURE__ */ __name(function get() {
        return this._writableState.length;
      }, "get")
    });
    function onend() {
      if (this._writableState.ended) return;
      process.nextTick(onEndNT, this);
    }
    __name(onend, "onend");
    function onEndNT(self2) {
      self2.end();
    }
    __name(onEndNT, "onEndNT");
    Object.defineProperty(Duplex.prototype, "destroyed", {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: /* @__PURE__ */ __name(function get() {
        if (this._readableState === void 0 || this._writableState === void 0) {
          return false;
        }
        return this._readableState.destroyed && this._writableState.destroyed;
      }, "get"),
      set: /* @__PURE__ */ __name(function set(value) {
        if (this._readableState === void 0 || this._writableState === void 0) {
          return;
        }
        this._readableState.destroyed = value;
        this._writableState.destroyed = value;
      }, "set")
    });
  }
});

// node_modules/winston-transport/node_modules/readable-stream/lib/_stream_writable.js
var require_stream_writable = __commonJS({
  "node_modules/winston-transport/node_modules/readable-stream/lib/_stream_writable.js"(exports2, module2) {
    "use strict";
    module2.exports = Writable;
    function CorkedRequest(state2) {
      var _this = this;
      this.next = null;
      this.entry = null;
      this.finish = function() {
        onCorkedFinish(_this, state2);
      };
    }
    __name(CorkedRequest, "CorkedRequest");
    var Duplex;
    Writable.WritableState = WritableState;
    var internalUtil = {
      deprecate: require_node()
    };
    var Stream = require_stream();
    var Buffer2 = require("buffer").Buffer;
    var OurUint8Array = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : {}).Uint8Array || function() {
    };
    function _uint8ArrayToBuffer(chunk) {
      return Buffer2.from(chunk);
    }
    __name(_uint8ArrayToBuffer, "_uint8ArrayToBuffer");
    function _isUint8Array(obj) {
      return Buffer2.isBuffer(obj) || obj instanceof OurUint8Array;
    }
    __name(_isUint8Array, "_isUint8Array");
    var destroyImpl = require_destroy();
    var _require = require_state();
    var getHighWaterMark = _require.getHighWaterMark;
    var _require$codes = require_errors2().codes;
    var ERR_INVALID_ARG_TYPE = _require$codes.ERR_INVALID_ARG_TYPE;
    var ERR_METHOD_NOT_IMPLEMENTED = _require$codes.ERR_METHOD_NOT_IMPLEMENTED;
    var ERR_MULTIPLE_CALLBACK = _require$codes.ERR_MULTIPLE_CALLBACK;
    var ERR_STREAM_CANNOT_PIPE = _require$codes.ERR_STREAM_CANNOT_PIPE;
    var ERR_STREAM_DESTROYED = _require$codes.ERR_STREAM_DESTROYED;
    var ERR_STREAM_NULL_VALUES = _require$codes.ERR_STREAM_NULL_VALUES;
    var ERR_STREAM_WRITE_AFTER_END = _require$codes.ERR_STREAM_WRITE_AFTER_END;
    var ERR_UNKNOWN_ENCODING = _require$codes.ERR_UNKNOWN_ENCODING;
    var errorOrDestroy = destroyImpl.errorOrDestroy;
    require_inherits()(Writable, Stream);
    function nop() {
    }
    __name(nop, "nop");
    function WritableState(options, stream, isDuplex) {
      Duplex = Duplex || require_stream_duplex();
      options = options || {};
      if (typeof isDuplex !== "boolean") isDuplex = stream instanceof Duplex;
      this.objectMode = !!options.objectMode;
      if (isDuplex) this.objectMode = this.objectMode || !!options.writableObjectMode;
      this.highWaterMark = getHighWaterMark(this, options, "writableHighWaterMark", isDuplex);
      this.finalCalled = false;
      this.needDrain = false;
      this.ending = false;
      this.ended = false;
      this.finished = false;
      this.destroyed = false;
      var noDecode = options.decodeStrings === false;
      this.decodeStrings = !noDecode;
      this.defaultEncoding = options.defaultEncoding || "utf8";
      this.length = 0;
      this.writing = false;
      this.corked = 0;
      this.sync = true;
      this.bufferProcessing = false;
      this.onwrite = function(er) {
        onwrite(stream, er);
      };
      this.writecb = null;
      this.writelen = 0;
      this.bufferedRequest = null;
      this.lastBufferedRequest = null;
      this.pendingcb = 0;
      this.prefinished = false;
      this.errorEmitted = false;
      this.emitClose = options.emitClose !== false;
      this.autoDestroy = !!options.autoDestroy;
      this.bufferedRequestCount = 0;
      this.corkedRequestsFree = new CorkedRequest(this);
    }
    __name(WritableState, "WritableState");
    WritableState.prototype.getBuffer = /* @__PURE__ */ __name(function getBuffer() {
      var current = this.bufferedRequest;
      var out = [];
      while (current) {
        out.push(current);
        current = current.next;
      }
      return out;
    }, "getBuffer");
    (function() {
      try {
        Object.defineProperty(WritableState.prototype, "buffer", {
          get: internalUtil.deprecate(/* @__PURE__ */ __name(function writableStateBufferGetter() {
            return this.getBuffer();
          }, "writableStateBufferGetter"), "_writableState.buffer is deprecated. Use _writableState.getBuffer instead.", "DEP0003")
        });
      } catch (_) {
      }
    })();
    var realHasInstance;
    if (typeof Symbol === "function" && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] === "function") {
      realHasInstance = Function.prototype[Symbol.hasInstance];
      Object.defineProperty(Writable, Symbol.hasInstance, {
        value: /* @__PURE__ */ __name(function value(object) {
          if (realHasInstance.call(this, object)) return true;
          if (this !== Writable) return false;
          return object && object._writableState instanceof WritableState;
        }, "value")
      });
    } else {
      realHasInstance = /* @__PURE__ */ __name(function realHasInstance2(object) {
        return object instanceof this;
      }, "realHasInstance");
    }
    function Writable(options) {
      Duplex = Duplex || require_stream_duplex();
      var isDuplex = this instanceof Duplex;
      if (!isDuplex && !realHasInstance.call(Writable, this)) return new Writable(options);
      this._writableState = new WritableState(options, this, isDuplex);
      this.writable = true;
      if (options) {
        if (typeof options.write === "function") this._write = options.write;
        if (typeof options.writev === "function") this._writev = options.writev;
        if (typeof options.destroy === "function") this._destroy = options.destroy;
        if (typeof options.final === "function") this._final = options.final;
      }
      Stream.call(this);
    }
    __name(Writable, "Writable");
    Writable.prototype.pipe = function() {
      errorOrDestroy(this, new ERR_STREAM_CANNOT_PIPE());
    };
    function writeAfterEnd(stream, cb) {
      var er = new ERR_STREAM_WRITE_AFTER_END();
      errorOrDestroy(stream, er);
      process.nextTick(cb, er);
    }
    __name(writeAfterEnd, "writeAfterEnd");
    function validChunk(stream, state2, chunk, cb) {
      var er;
      if (chunk === null) {
        er = new ERR_STREAM_NULL_VALUES();
      } else if (typeof chunk !== "string" && !state2.objectMode) {
        er = new ERR_INVALID_ARG_TYPE("chunk", ["string", "Buffer"], chunk);
      }
      if (er) {
        errorOrDestroy(stream, er);
        process.nextTick(cb, er);
        return false;
      }
      return true;
    }
    __name(validChunk, "validChunk");
    Writable.prototype.write = function(chunk, encoding, cb) {
      var state2 = this._writableState;
      var ret = false;
      var isBuf = !state2.objectMode && _isUint8Array(chunk);
      if (isBuf && !Buffer2.isBuffer(chunk)) {
        chunk = _uint8ArrayToBuffer(chunk);
      }
      if (typeof encoding === "function") {
        cb = encoding;
        encoding = null;
      }
      if (isBuf) encoding = "buffer";
      else if (!encoding) encoding = state2.defaultEncoding;
      if (typeof cb !== "function") cb = nop;
      if (state2.ending) writeAfterEnd(this, cb);
      else if (isBuf || validChunk(this, state2, chunk, cb)) {
        state2.pendingcb++;
        ret = writeOrBuffer(this, state2, isBuf, chunk, encoding, cb);
      }
      return ret;
    };
    Writable.prototype.cork = function() {
      this._writableState.corked++;
    };
    Writable.prototype.uncork = function() {
      var state2 = this._writableState;
      if (state2.corked) {
        state2.corked--;
        if (!state2.writing && !state2.corked && !state2.bufferProcessing && state2.bufferedRequest) clearBuffer(this, state2);
      }
    };
    Writable.prototype.setDefaultEncoding = /* @__PURE__ */ __name(function setDefaultEncoding(encoding) {
      if (typeof encoding === "string") encoding = encoding.toLowerCase();
      if (!(["hex", "utf8", "utf-8", "ascii", "binary", "base64", "ucs2", "ucs-2", "utf16le", "utf-16le", "raw"].indexOf((encoding + "").toLowerCase()) > -1)) throw new ERR_UNKNOWN_ENCODING(encoding);
      this._writableState.defaultEncoding = encoding;
      return this;
    }, "setDefaultEncoding");
    Object.defineProperty(Writable.prototype, "writableBuffer", {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: /* @__PURE__ */ __name(function get() {
        return this._writableState && this._writableState.getBuffer();
      }, "get")
    });
    function decodeChunk(state2, chunk, encoding) {
      if (!state2.objectMode && state2.decodeStrings !== false && typeof chunk === "string") {
        chunk = Buffer2.from(chunk, encoding);
      }
      return chunk;
    }
    __name(decodeChunk, "decodeChunk");
    Object.defineProperty(Writable.prototype, "writableHighWaterMark", {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: /* @__PURE__ */ __name(function get() {
        return this._writableState.highWaterMark;
      }, "get")
    });
    function writeOrBuffer(stream, state2, isBuf, chunk, encoding, cb) {
      if (!isBuf) {
        var newChunk = decodeChunk(state2, chunk, encoding);
        if (chunk !== newChunk) {
          isBuf = true;
          encoding = "buffer";
          chunk = newChunk;
        }
      }
      var len = state2.objectMode ? 1 : chunk.length;
      state2.length += len;
      var ret = state2.length < state2.highWaterMark;
      if (!ret) state2.needDrain = true;
      if (state2.writing || state2.corked) {
        var last = state2.lastBufferedRequest;
        state2.lastBufferedRequest = {
          chunk,
          encoding,
          isBuf,
          callback: cb,
          next: null
        };
        if (last) {
          last.next = state2.lastBufferedRequest;
        } else {
          state2.bufferedRequest = state2.lastBufferedRequest;
        }
        state2.bufferedRequestCount += 1;
      } else {
        doWrite(stream, state2, false, len, chunk, encoding, cb);
      }
      return ret;
    }
    __name(writeOrBuffer, "writeOrBuffer");
    function doWrite(stream, state2, writev, len, chunk, encoding, cb) {
      state2.writelen = len;
      state2.writecb = cb;
      state2.writing = true;
      state2.sync = true;
      if (state2.destroyed) state2.onwrite(new ERR_STREAM_DESTROYED("write"));
      else if (writev) stream._writev(chunk, state2.onwrite);
      else stream._write(chunk, encoding, state2.onwrite);
      state2.sync = false;
    }
    __name(doWrite, "doWrite");
    function onwriteError(stream, state2, sync, er, cb) {
      --state2.pendingcb;
      if (sync) {
        process.nextTick(cb, er);
        process.nextTick(finishMaybe, stream, state2);
        stream._writableState.errorEmitted = true;
        errorOrDestroy(stream, er);
      } else {
        cb(er);
        stream._writableState.errorEmitted = true;
        errorOrDestroy(stream, er);
        finishMaybe(stream, state2);
      }
    }
    __name(onwriteError, "onwriteError");
    function onwriteStateUpdate(state2) {
      state2.writing = false;
      state2.writecb = null;
      state2.length -= state2.writelen;
      state2.writelen = 0;
    }
    __name(onwriteStateUpdate, "onwriteStateUpdate");
    function onwrite(stream, er) {
      var state2 = stream._writableState;
      var sync = state2.sync;
      var cb = state2.writecb;
      if (typeof cb !== "function") throw new ERR_MULTIPLE_CALLBACK();
      onwriteStateUpdate(state2);
      if (er) onwriteError(stream, state2, sync, er, cb);
      else {
        var finished = needFinish(state2) || stream.destroyed;
        if (!finished && !state2.corked && !state2.bufferProcessing && state2.bufferedRequest) {
          clearBuffer(stream, state2);
        }
        if (sync) {
          process.nextTick(afterWrite, stream, state2, finished, cb);
        } else {
          afterWrite(stream, state2, finished, cb);
        }
      }
    }
    __name(onwrite, "onwrite");
    function afterWrite(stream, state2, finished, cb) {
      if (!finished) onwriteDrain(stream, state2);
      state2.pendingcb--;
      cb();
      finishMaybe(stream, state2);
    }
    __name(afterWrite, "afterWrite");
    function onwriteDrain(stream, state2) {
      if (state2.length === 0 && state2.needDrain) {
        state2.needDrain = false;
        stream.emit("drain");
      }
    }
    __name(onwriteDrain, "onwriteDrain");
    function clearBuffer(stream, state2) {
      state2.bufferProcessing = true;
      var entry = state2.bufferedRequest;
      if (stream._writev && entry && entry.next) {
        var l = state2.bufferedRequestCount;
        var buffer = new Array(l);
        var holder = state2.corkedRequestsFree;
        holder.entry = entry;
        var count = 0;
        var allBuffers = true;
        while (entry) {
          buffer[count] = entry;
          if (!entry.isBuf) allBuffers = false;
          entry = entry.next;
          count += 1;
        }
        buffer.allBuffers = allBuffers;
        doWrite(stream, state2, true, state2.length, buffer, "", holder.finish);
        state2.pendingcb++;
        state2.lastBufferedRequest = null;
        if (holder.next) {
          state2.corkedRequestsFree = holder.next;
          holder.next = null;
        } else {
          state2.corkedRequestsFree = new CorkedRequest(state2);
        }
        state2.bufferedRequestCount = 0;
      } else {
        while (entry) {
          var chunk = entry.chunk;
          var encoding = entry.encoding;
          var cb = entry.callback;
          var len = state2.objectMode ? 1 : chunk.length;
          doWrite(stream, state2, false, len, chunk, encoding, cb);
          entry = entry.next;
          state2.bufferedRequestCount--;
          if (state2.writing) {
            break;
          }
        }
        if (entry === null) state2.lastBufferedRequest = null;
      }
      state2.bufferedRequest = entry;
      state2.bufferProcessing = false;
    }
    __name(clearBuffer, "clearBuffer");
    Writable.prototype._write = function(chunk, encoding, cb) {
      cb(new ERR_METHOD_NOT_IMPLEMENTED("_write()"));
    };
    Writable.prototype._writev = null;
    Writable.prototype.end = function(chunk, encoding, cb) {
      var state2 = this._writableState;
      if (typeof chunk === "function") {
        cb = chunk;
        chunk = null;
        encoding = null;
      } else if (typeof encoding === "function") {
        cb = encoding;
        encoding = null;
      }
      if (chunk !== null && chunk !== void 0) this.write(chunk, encoding);
      if (state2.corked) {
        state2.corked = 1;
        this.uncork();
      }
      if (!state2.ending) endWritable(this, state2, cb);
      return this;
    };
    Object.defineProperty(Writable.prototype, "writableLength", {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: /* @__PURE__ */ __name(function get() {
        return this._writableState.length;
      }, "get")
    });
    function needFinish(state2) {
      return state2.ending && state2.length === 0 && state2.bufferedRequest === null && !state2.finished && !state2.writing;
    }
    __name(needFinish, "needFinish");
    function callFinal(stream, state2) {
      stream._final(function(err) {
        state2.pendingcb--;
        if (err) {
          errorOrDestroy(stream, err);
        }
        state2.prefinished = true;
        stream.emit("prefinish");
        finishMaybe(stream, state2);
      });
    }
    __name(callFinal, "callFinal");
    function prefinish(stream, state2) {
      if (!state2.prefinished && !state2.finalCalled) {
        if (typeof stream._final === "function" && !state2.destroyed) {
          state2.pendingcb++;
          state2.finalCalled = true;
          process.nextTick(callFinal, stream, state2);
        } else {
          state2.prefinished = true;
          stream.emit("prefinish");
        }
      }
    }
    __name(prefinish, "prefinish");
    function finishMaybe(stream, state2) {
      var need = needFinish(state2);
      if (need) {
        prefinish(stream, state2);
        if (state2.pendingcb === 0) {
          state2.finished = true;
          stream.emit("finish");
          if (state2.autoDestroy) {
            var rState = stream._readableState;
            if (!rState || rState.autoDestroy && rState.endEmitted) {
              stream.destroy();
            }
          }
        }
      }
      return need;
    }
    __name(finishMaybe, "finishMaybe");
    function endWritable(stream, state2, cb) {
      state2.ending = true;
      finishMaybe(stream, state2);
      if (cb) {
        if (state2.finished) process.nextTick(cb);
        else stream.once("finish", cb);
      }
      state2.ended = true;
      stream.writable = false;
    }
    __name(endWritable, "endWritable");
    function onCorkedFinish(corkReq, state2, err) {
      var entry = corkReq.entry;
      corkReq.entry = null;
      while (entry) {
        var cb = entry.callback;
        state2.pendingcb--;
        cb(err);
        entry = entry.next;
      }
      state2.corkedRequestsFree.next = corkReq;
    }
    __name(onCorkedFinish, "onCorkedFinish");
    Object.defineProperty(Writable.prototype, "destroyed", {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: /* @__PURE__ */ __name(function get() {
        if (this._writableState === void 0) {
          return false;
        }
        return this._writableState.destroyed;
      }, "get"),
      set: /* @__PURE__ */ __name(function set(value) {
        if (!this._writableState) {
          return;
        }
        this._writableState.destroyed = value;
      }, "set")
    });
    Writable.prototype.destroy = destroyImpl.destroy;
    Writable.prototype._undestroy = destroyImpl.undestroy;
    Writable.prototype._destroy = function(err, cb) {
      cb(err);
    };
  }
});

// node_modules/winston-transport/modern.js
var require_modern = __commonJS({
  "node_modules/winston-transport/modern.js"(exports2, module2) {
    "use strict";
    var util = require("util");
    var Writable = require_stream_writable();
    var { LEVEL } = require_triple_beam();
    var TransportStream = module2.exports = /* @__PURE__ */ __name(function TransportStream2(options = {}) {
      Writable.call(this, { objectMode: true, highWaterMark: options.highWaterMark });
      this.format = options.format;
      this.level = options.level;
      this.handleExceptions = options.handleExceptions;
      this.handleRejections = options.handleRejections;
      this.silent = options.silent;
      if (options.log) this.log = options.log;
      if (options.logv) this.logv = options.logv;
      if (options.close) this.close = options.close;
      this.once("pipe", (logger) => {
        this.levels = logger.levels;
        this.parent = logger;
      });
      this.once("unpipe", (src) => {
        if (src === this.parent) {
          this.parent = null;
          if (this.close) {
            this.close();
          }
        }
      });
    }, "TransportStream");
    util.inherits(TransportStream, Writable);
    TransportStream.prototype._write = /* @__PURE__ */ __name(function _write(info, enc, callback) {
      if (this.silent || info.exception === true && !this.handleExceptions) {
        return callback(null);
      }
      const level = this.level || this.parent && this.parent.level;
      if (!level || this.levels[level] >= this.levels[info[LEVEL]]) {
        if (info && !this.format) {
          return this.log(info, callback);
        }
        let errState;
        let transformed;
        try {
          transformed = this.format.transform(Object.assign({}, info), this.format.options);
        } catch (err) {
          errState = err;
        }
        if (errState || !transformed) {
          callback();
          if (errState) throw errState;
          return;
        }
        return this.log(transformed, callback);
      }
      this._writableState.sync = false;
      return callback(null);
    }, "_write");
    TransportStream.prototype._writev = /* @__PURE__ */ __name(function _writev(chunks, callback) {
      if (this.logv) {
        const infos = chunks.filter(this._accept, this);
        if (!infos.length) {
          return callback(null);
        }
        return this.logv(infos, callback);
      }
      for (let i = 0; i < chunks.length; i++) {
        if (!this._accept(chunks[i])) continue;
        if (chunks[i].chunk && !this.format) {
          this.log(chunks[i].chunk, chunks[i].callback);
          continue;
        }
        let errState;
        let transformed;
        try {
          transformed = this.format.transform(
            Object.assign({}, chunks[i].chunk),
            this.format.options
          );
        } catch (err) {
          errState = err;
        }
        if (errState || !transformed) {
          chunks[i].callback();
          if (errState) {
            callback(null);
            throw errState;
          }
        } else {
          this.log(transformed, chunks[i].callback);
        }
      }
      return callback(null);
    }, "_writev");
    TransportStream.prototype._accept = /* @__PURE__ */ __name(function _accept(write) {
      const info = write.chunk;
      if (this.silent) {
        return false;
      }
      const level = this.level || this.parent && this.parent.level;
      if (info.exception === true || !level || this.levels[level] >= this.levels[info[LEVEL]]) {
        if (this.handleExceptions || info.exception !== true) {
          return true;
        }
      }
      return false;
    }, "_accept");
    TransportStream.prototype._nop = /* @__PURE__ */ __name(function _nop() {
      return void 0;
    }, "_nop");
  }
});

// node_modules/winston-transport/legacy.js
var require_legacy = __commonJS({
  "node_modules/winston-transport/legacy.js"(exports2, module2) {
    "use strict";
    var util = require("util");
    var { LEVEL } = require_triple_beam();
    var TransportStream = require_modern();
    var LegacyTransportStream = module2.exports = /* @__PURE__ */ __name(function LegacyTransportStream2(options = {}) {
      TransportStream.call(this, options);
      if (!options.transport || typeof options.transport.log !== "function") {
        throw new Error("Invalid transport, must be an object with a log method.");
      }
      this.transport = options.transport;
      this.level = this.level || options.transport.level;
      this.handleExceptions = this.handleExceptions || options.transport.handleExceptions;
      this._deprecated();
      function transportError(err) {
        this.emit("error", err, this.transport);
      }
      __name(transportError, "transportError");
      if (!this.transport.__winstonError) {
        this.transport.__winstonError = transportError.bind(this);
        this.transport.on("error", this.transport.__winstonError);
      }
    }, "LegacyTransportStream");
    util.inherits(LegacyTransportStream, TransportStream);
    LegacyTransportStream.prototype._write = /* @__PURE__ */ __name(function _write(info, enc, callback) {
      if (this.silent || info.exception === true && !this.handleExceptions) {
        return callback(null);
      }
      if (!this.level || this.levels[this.level] >= this.levels[info[LEVEL]]) {
        this.transport.log(info[LEVEL], info.message, info, this._nop);
      }
      callback(null);
    }, "_write");
    LegacyTransportStream.prototype._writev = /* @__PURE__ */ __name(function _writev(chunks, callback) {
      for (let i = 0; i < chunks.length; i++) {
        if (this._accept(chunks[i])) {
          this.transport.log(
            chunks[i].chunk[LEVEL],
            chunks[i].chunk.message,
            chunks[i].chunk,
            this._nop
          );
          chunks[i].callback();
        }
      }
      return callback(null);
    }, "_writev");
    LegacyTransportStream.prototype._deprecated = /* @__PURE__ */ __name(function _deprecated() {
      console.error([
        `${this.transport.name} is a legacy winston transport. Consider upgrading: `,
        "- Upgrade docs: https://github.com/winstonjs/winston/blob/master/UPGRADE-3.0.md"
      ].join("\n"));
    }, "_deprecated");
    LegacyTransportStream.prototype.close = /* @__PURE__ */ __name(function close() {
      if (this.transport.close) {
        this.transport.close();
      }
      if (this.transport.__winstonError) {
        this.transport.removeListener("error", this.transport.__winstonError);
        this.transport.__winstonError = null;
      }
    }, "close");
  }
});

// node_modules/winston-transport/index.js
var require_winston_transport = __commonJS({
  "node_modules/winston-transport/index.js"(exports2, module2) {
    "use strict";
    module2.exports = require_modern();
    module2.exports.LegacyTransportStream = require_legacy();
  }
});

// node_modules/winston/lib/winston/transports/console.js
var require_console = __commonJS({
  "node_modules/winston/lib/winston/transports/console.js"(exports2, module2) {
    "use strict";
    var os = require("os");
    var { LEVEL, MESSAGE } = require_triple_beam();
    var TransportStream = require_winston_transport();
    module2.exports = class Console extends TransportStream {
      static {
        __name(this, "Console");
      }
      /**
       * Constructor function for the Console transport object responsible for
       * persisting log messages and metadata to a terminal or TTY.
       * @param {!Object} [options={}] - Options for this instance.
       */
      constructor(options = {}) {
        super(options);
        this.name = options.name || "console";
        this.stderrLevels = this._stringArrayToSet(options.stderrLevels);
        this.consoleWarnLevels = this._stringArrayToSet(options.consoleWarnLevels);
        this.eol = typeof options.eol === "string" ? options.eol : os.EOL;
        this.forceConsole = options.forceConsole || false;
        this._consoleLog = console.log.bind(console);
        this._consoleWarn = console.warn.bind(console);
        this._consoleError = console.error.bind(console);
        this.setMaxListeners(30);
      }
      /**
       * Core logging method exposed to Winston.
       * @param {Object} info - TODO: add param description.
       * @param {Function} callback - TODO: add param description.
       * @returns {undefined}
       */
      log(info, callback) {
        setImmediate(() => this.emit("logged", info));
        if (this.stderrLevels[info[LEVEL]]) {
          if (console._stderr && !this.forceConsole) {
            console._stderr.write(`${info[MESSAGE]}${this.eol}`);
          } else {
            this._consoleError(info[MESSAGE]);
          }
          if (callback) {
            callback();
          }
          return;
        } else if (this.consoleWarnLevels[info[LEVEL]]) {
          if (console._stderr && !this.forceConsole) {
            console._stderr.write(`${info[MESSAGE]}${this.eol}`);
          } else {
            this._consoleWarn(info[MESSAGE]);
          }
          if (callback) {
            callback();
          }
          return;
        }
        if (console._stdout && !this.forceConsole) {
          console._stdout.write(`${info[MESSAGE]}${this.eol}`);
        } else {
          this._consoleLog(info[MESSAGE]);
        }
        if (callback) {
          callback();
        }
      }
      /**
       * Returns a Set-like object with strArray's elements as keys (each with the
       * value true).
       * @param {Array} strArray - Array of Set-elements as strings.
       * @param {?string} [errMsg] - Custom error message thrown on invalid input.
       * @returns {Object} - TODO: add return description.
       * @private
       */
      _stringArrayToSet(strArray, errMsg) {
        if (!strArray) return {};
        errMsg = errMsg || "Cannot make set from type other than Array of string elements";
        if (!Array.isArray(strArray)) {
          throw new Error(errMsg);
        }
        return strArray.reduce((set, el) => {
          if (typeof el !== "string") {
            throw new Error(errMsg);
          }
          set[el] = true;
          return set;
        }, {});
      }
    };
  }
});

// node_modules/async/internal/isArrayLike.js
var require_isArrayLike = __commonJS({
  "node_modules/async/internal/isArrayLike.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isArrayLike;
    function isArrayLike(value) {
      return value && typeof value.length === "number" && value.length >= 0 && value.length % 1 === 0;
    }
    __name(isArrayLike, "isArrayLike");
    module2.exports = exports2.default;
  }
});

// node_modules/async/internal/initialParams.js
var require_initialParams = __commonJS({
  "node_modules/async/internal/initialParams.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = function(fn) {
      return function(...args) {
        var callback = args.pop();
        return fn.call(this, args, callback);
      };
    };
    module2.exports = exports2.default;
  }
});

// node_modules/async/internal/setImmediate.js
var require_setImmediate = __commonJS({
  "node_modules/async/internal/setImmediate.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.fallback = fallback;
    exports2.wrap = wrap;
    var hasQueueMicrotask = exports2.hasQueueMicrotask = typeof queueMicrotask === "function" && queueMicrotask;
    var hasSetImmediate = exports2.hasSetImmediate = typeof setImmediate === "function" && setImmediate;
    var hasNextTick = exports2.hasNextTick = typeof process === "object" && typeof process.nextTick === "function";
    function fallback(fn) {
      setTimeout(fn, 0);
    }
    __name(fallback, "fallback");
    function wrap(defer) {
      return (fn, ...args) => defer(() => fn(...args));
    }
    __name(wrap, "wrap");
    var _defer;
    if (hasQueueMicrotask) {
      _defer = queueMicrotask;
    } else if (hasSetImmediate) {
      _defer = setImmediate;
    } else if (hasNextTick) {
      _defer = process.nextTick;
    } else {
      _defer = fallback;
    }
    exports2.default = wrap(_defer);
  }
});

// node_modules/async/asyncify.js
var require_asyncify = __commonJS({
  "node_modules/async/asyncify.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = asyncify;
    var _initialParams = require_initialParams();
    var _initialParams2 = _interopRequireDefault(_initialParams);
    var _setImmediate = require_setImmediate();
    var _setImmediate2 = _interopRequireDefault(_setImmediate);
    var _wrapAsync = require_wrapAsync();
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    __name(_interopRequireDefault, "_interopRequireDefault");
    function asyncify(func) {
      if ((0, _wrapAsync.isAsync)(func)) {
        return function(...args) {
          const callback = args.pop();
          const promise = func.apply(this, args);
          return handlePromise(promise, callback);
        };
      }
      return (0, _initialParams2.default)(function(args, callback) {
        var result;
        try {
          result = func.apply(this, args);
        } catch (e) {
          return callback(e);
        }
        if (result && typeof result.then === "function") {
          return handlePromise(result, callback);
        } else {
          callback(null, result);
        }
      });
    }
    __name(asyncify, "asyncify");
    function handlePromise(promise, callback) {
      return promise.then((value) => {
        invokeCallback(callback, null, value);
      }, (err) => {
        invokeCallback(callback, err && (err instanceof Error || err.message) ? err : new Error(err));
      });
    }
    __name(handlePromise, "handlePromise");
    function invokeCallback(callback, error, value) {
      try {
        callback(error, value);
      } catch (err) {
        (0, _setImmediate2.default)((e) => {
          throw e;
        }, err);
      }
    }
    __name(invokeCallback, "invokeCallback");
    module2.exports = exports2.default;
  }
});

// node_modules/async/internal/wrapAsync.js
var require_wrapAsync = __commonJS({
  "node_modules/async/internal/wrapAsync.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.isAsyncIterable = exports2.isAsyncGenerator = exports2.isAsync = void 0;
    var _asyncify = require_asyncify();
    var _asyncify2 = _interopRequireDefault(_asyncify);
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    __name(_interopRequireDefault, "_interopRequireDefault");
    function isAsync(fn) {
      return fn[Symbol.toStringTag] === "AsyncFunction";
    }
    __name(isAsync, "isAsync");
    function isAsyncGenerator(fn) {
      return fn[Symbol.toStringTag] === "AsyncGenerator";
    }
    __name(isAsyncGenerator, "isAsyncGenerator");
    function isAsyncIterable(obj) {
      return typeof obj[Symbol.asyncIterator] === "function";
    }
    __name(isAsyncIterable, "isAsyncIterable");
    function wrapAsync(asyncFn) {
      if (typeof asyncFn !== "function") throw new Error("expected a function");
      return isAsync(asyncFn) ? (0, _asyncify2.default)(asyncFn) : asyncFn;
    }
    __name(wrapAsync, "wrapAsync");
    exports2.default = wrapAsync;
    exports2.isAsync = isAsync;
    exports2.isAsyncGenerator = isAsyncGenerator;
    exports2.isAsyncIterable = isAsyncIterable;
  }
});

// node_modules/async/internal/awaitify.js
var require_awaitify = __commonJS({
  "node_modules/async/internal/awaitify.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = awaitify;
    function awaitify(asyncFn, arity) {
      if (!arity) arity = asyncFn.length;
      if (!arity) throw new Error("arity is undefined");
      function awaitable(...args) {
        if (typeof args[arity - 1] === "function") {
          return asyncFn.apply(this, args);
        }
        return new Promise((resolve, reject) => {
          args[arity - 1] = (err, ...cbArgs) => {
            if (err) return reject(err);
            resolve(cbArgs.length > 1 ? cbArgs : cbArgs[0]);
          };
          asyncFn.apply(this, args);
        });
      }
      __name(awaitable, "awaitable");
      return awaitable;
    }
    __name(awaitify, "awaitify");
    module2.exports = exports2.default;
  }
});

// node_modules/async/internal/parallel.js
var require_parallel = __commonJS({
  "node_modules/async/internal/parallel.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    var _isArrayLike = require_isArrayLike();
    var _isArrayLike2 = _interopRequireDefault(_isArrayLike);
    var _wrapAsync = require_wrapAsync();
    var _wrapAsync2 = _interopRequireDefault(_wrapAsync);
    var _awaitify = require_awaitify();
    var _awaitify2 = _interopRequireDefault(_awaitify);
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    __name(_interopRequireDefault, "_interopRequireDefault");
    exports2.default = (0, _awaitify2.default)((eachfn, tasks, callback) => {
      var results = (0, _isArrayLike2.default)(tasks) ? [] : {};
      eachfn(tasks, (task, key, taskCb) => {
        (0, _wrapAsync2.default)(task)((err, ...result) => {
          if (result.length < 2) {
            [result] = result;
          }
          results[key] = result;
          taskCb(err);
        });
      }, (err) => callback(err, results));
    }, 3);
    module2.exports = exports2.default;
  }
});

// node_modules/async/internal/once.js
var require_once = __commonJS({
  "node_modules/async/internal/once.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = once;
    function once(fn) {
      function wrapper(...args) {
        if (fn === null) return;
        var callFn = fn;
        fn = null;
        callFn.apply(this, args);
      }
      __name(wrapper, "wrapper");
      Object.assign(wrapper, fn);
      return wrapper;
    }
    __name(once, "once");
    module2.exports = exports2.default;
  }
});

// node_modules/async/internal/getIterator.js
var require_getIterator = __commonJS({
  "node_modules/async/internal/getIterator.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = function(coll) {
      return coll[Symbol.iterator] && coll[Symbol.iterator]();
    };
    module2.exports = exports2.default;
  }
});

// node_modules/async/internal/iterator.js
var require_iterator = __commonJS({
  "node_modules/async/internal/iterator.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = createIterator;
    var _isArrayLike = require_isArrayLike();
    var _isArrayLike2 = _interopRequireDefault(_isArrayLike);
    var _getIterator = require_getIterator();
    var _getIterator2 = _interopRequireDefault(_getIterator);
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    __name(_interopRequireDefault, "_interopRequireDefault");
    function createArrayIterator(coll) {
      var i = -1;
      var len = coll.length;
      return /* @__PURE__ */ __name(function next() {
        return ++i < len ? { value: coll[i], key: i } : null;
      }, "next");
    }
    __name(createArrayIterator, "createArrayIterator");
    function createES2015Iterator(iterator) {
      var i = -1;
      return /* @__PURE__ */ __name(function next() {
        var item = iterator.next();
        if (item.done) return null;
        i++;
        return { value: item.value, key: i };
      }, "next");
    }
    __name(createES2015Iterator, "createES2015Iterator");
    function createObjectIterator(obj) {
      var okeys = obj ? Object.keys(obj) : [];
      var i = -1;
      var len = okeys.length;
      return /* @__PURE__ */ __name(function next() {
        var key = okeys[++i];
        if (key === "__proto__") {
          return next();
        }
        return i < len ? { value: obj[key], key } : null;
      }, "next");
    }
    __name(createObjectIterator, "createObjectIterator");
    function createIterator(coll) {
      if ((0, _isArrayLike2.default)(coll)) {
        return createArrayIterator(coll);
      }
      var iterator = (0, _getIterator2.default)(coll);
      return iterator ? createES2015Iterator(iterator) : createObjectIterator(coll);
    }
    __name(createIterator, "createIterator");
    module2.exports = exports2.default;
  }
});

// node_modules/async/internal/onlyOnce.js
var require_onlyOnce = __commonJS({
  "node_modules/async/internal/onlyOnce.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = onlyOnce;
    function onlyOnce(fn) {
      return function(...args) {
        if (fn === null) throw new Error("Callback was already called.");
        var callFn = fn;
        fn = null;
        callFn.apply(this, args);
      };
    }
    __name(onlyOnce, "onlyOnce");
    module2.exports = exports2.default;
  }
});

// node_modules/async/internal/breakLoop.js
var require_breakLoop = __commonJS({
  "node_modules/async/internal/breakLoop.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    var breakLoop = {};
    exports2.default = breakLoop;
    module2.exports = exports2.default;
  }
});

// node_modules/async/internal/asyncEachOfLimit.js
var require_asyncEachOfLimit = __commonJS({
  "node_modules/async/internal/asyncEachOfLimit.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = asyncEachOfLimit;
    var _breakLoop = require_breakLoop();
    var _breakLoop2 = _interopRequireDefault(_breakLoop);
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    __name(_interopRequireDefault, "_interopRequireDefault");
    function asyncEachOfLimit(generator, limit, iteratee, callback) {
      let done = false;
      let canceled = false;
      let awaiting = false;
      let running = 0;
      let idx = 0;
      function replenish() {
        if (running >= limit || awaiting || done) return;
        awaiting = true;
        generator.next().then(({ value, done: iterDone }) => {
          if (canceled || done) return;
          awaiting = false;
          if (iterDone) {
            done = true;
            if (running <= 0) {
              callback(null);
            }
            return;
          }
          running++;
          iteratee(value, idx, iterateeCallback);
          idx++;
          replenish();
        }).catch(handleError);
      }
      __name(replenish, "replenish");
      function iterateeCallback(err, result) {
        running -= 1;
        if (canceled) return;
        if (err) return handleError(err);
        if (err === false) {
          done = true;
          canceled = true;
          return;
        }
        if (result === _breakLoop2.default || done && running <= 0) {
          done = true;
          return callback(null);
        }
        replenish();
      }
      __name(iterateeCallback, "iterateeCallback");
      function handleError(err) {
        if (canceled) return;
        awaiting = false;
        done = true;
        callback(err);
      }
      __name(handleError, "handleError");
      replenish();
    }
    __name(asyncEachOfLimit, "asyncEachOfLimit");
    module2.exports = exports2.default;
  }
});

// node_modules/async/internal/eachOfLimit.js
var require_eachOfLimit = __commonJS({
  "node_modules/async/internal/eachOfLimit.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    var _once = require_once();
    var _once2 = _interopRequireDefault(_once);
    var _iterator = require_iterator();
    var _iterator2 = _interopRequireDefault(_iterator);
    var _onlyOnce = require_onlyOnce();
    var _onlyOnce2 = _interopRequireDefault(_onlyOnce);
    var _wrapAsync = require_wrapAsync();
    var _asyncEachOfLimit = require_asyncEachOfLimit();
    var _asyncEachOfLimit2 = _interopRequireDefault(_asyncEachOfLimit);
    var _breakLoop = require_breakLoop();
    var _breakLoop2 = _interopRequireDefault(_breakLoop);
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    __name(_interopRequireDefault, "_interopRequireDefault");
    exports2.default = (limit) => {
      return (obj, iteratee, callback) => {
        callback = (0, _once2.default)(callback);
        if (limit <= 0) {
          throw new RangeError("concurrency limit cannot be less than 1");
        }
        if (!obj) {
          return callback(null);
        }
        if ((0, _wrapAsync.isAsyncGenerator)(obj)) {
          return (0, _asyncEachOfLimit2.default)(obj, limit, iteratee, callback);
        }
        if ((0, _wrapAsync.isAsyncIterable)(obj)) {
          return (0, _asyncEachOfLimit2.default)(obj[Symbol.asyncIterator](), limit, iteratee, callback);
        }
        var nextElem = (0, _iterator2.default)(obj);
        var done = false;
        var canceled = false;
        var running = 0;
        var looping = false;
        function iterateeCallback(err, value) {
          if (canceled) return;
          running -= 1;
          if (err) {
            done = true;
            callback(err);
          } else if (err === false) {
            done = true;
            canceled = true;
          } else if (value === _breakLoop2.default || done && running <= 0) {
            done = true;
            return callback(null);
          } else if (!looping) {
            replenish();
          }
        }
        __name(iterateeCallback, "iterateeCallback");
        function replenish() {
          looping = true;
          while (running < limit && !done) {
            var elem = nextElem();
            if (elem === null) {
              done = true;
              if (running <= 0) {
                callback(null);
              }
              return;
            }
            running += 1;
            iteratee(elem.value, elem.key, (0, _onlyOnce2.default)(iterateeCallback));
          }
          looping = false;
        }
        __name(replenish, "replenish");
        replenish();
      };
    };
    module2.exports = exports2.default;
  }
});

// node_modules/async/eachOfLimit.js
var require_eachOfLimit2 = __commonJS({
  "node_modules/async/eachOfLimit.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    var _eachOfLimit2 = require_eachOfLimit();
    var _eachOfLimit3 = _interopRequireDefault(_eachOfLimit2);
    var _wrapAsync = require_wrapAsync();
    var _wrapAsync2 = _interopRequireDefault(_wrapAsync);
    var _awaitify = require_awaitify();
    var _awaitify2 = _interopRequireDefault(_awaitify);
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    __name(_interopRequireDefault, "_interopRequireDefault");
    function eachOfLimit(coll, limit, iteratee, callback) {
      return (0, _eachOfLimit3.default)(limit)(coll, (0, _wrapAsync2.default)(iteratee), callback);
    }
    __name(eachOfLimit, "eachOfLimit");
    exports2.default = (0, _awaitify2.default)(eachOfLimit, 4);
    module2.exports = exports2.default;
  }
});

// node_modules/async/eachOfSeries.js
var require_eachOfSeries = __commonJS({
  "node_modules/async/eachOfSeries.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    var _eachOfLimit = require_eachOfLimit2();
    var _eachOfLimit2 = _interopRequireDefault(_eachOfLimit);
    var _awaitify = require_awaitify();
    var _awaitify2 = _interopRequireDefault(_awaitify);
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    __name(_interopRequireDefault, "_interopRequireDefault");
    function eachOfSeries(coll, iteratee, callback) {
      return (0, _eachOfLimit2.default)(coll, 1, iteratee, callback);
    }
    __name(eachOfSeries, "eachOfSeries");
    exports2.default = (0, _awaitify2.default)(eachOfSeries, 3);
    module2.exports = exports2.default;
  }
});

// node_modules/async/series.js
var require_series = __commonJS({
  "node_modules/async/series.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = series;
    var _parallel2 = require_parallel();
    var _parallel3 = _interopRequireDefault(_parallel2);
    var _eachOfSeries = require_eachOfSeries();
    var _eachOfSeries2 = _interopRequireDefault(_eachOfSeries);
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    __name(_interopRequireDefault, "_interopRequireDefault");
    function series(tasks, callback) {
      return (0, _parallel3.default)(_eachOfSeries2.default, tasks, callback);
    }
    __name(series, "series");
    module2.exports = exports2.default;
  }
});

// node_modules/winston/node_modules/readable-stream/lib/internal/streams/stream.js
var require_stream2 = __commonJS({
  "node_modules/winston/node_modules/readable-stream/lib/internal/streams/stream.js"(exports2, module2) {
    module2.exports = require("stream");
  }
});

// node_modules/winston/node_modules/readable-stream/lib/internal/streams/buffer_list.js
var require_buffer_list2 = __commonJS({
  "node_modules/winston/node_modules/readable-stream/lib/internal/streams/buffer_list.js"(exports2, module2) {
    "use strict";
    function ownKeys(object, enumerableOnly) {
      var keys = Object.keys(object);
      if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        enumerableOnly && (symbols = symbols.filter(function(sym) {
          return Object.getOwnPropertyDescriptor(object, sym).enumerable;
        })), keys.push.apply(keys, symbols);
      }
      return keys;
    }
    __name(ownKeys, "ownKeys");
    function _objectSpread(target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = null != arguments[i] ? arguments[i] : {};
        i % 2 ? ownKeys(Object(source), true).forEach(function(key) {
          _defineProperty(target, key, source[key]);
        }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function(key) {
          Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
      }
      return target;
    }
    __name(_objectSpread, "_objectSpread");
    function _defineProperty(obj, key, value) {
      key = _toPropertyKey(key);
      if (key in obj) {
        Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
      } else {
        obj[key] = value;
      }
      return obj;
    }
    __name(_defineProperty, "_defineProperty");
    function _classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
      }
    }
    __name(_classCallCheck, "_classCallCheck");
    function _defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor);
      }
    }
    __name(_defineProperties, "_defineProperties");
    function _createClass(Constructor, protoProps, staticProps) {
      if (protoProps) _defineProperties(Constructor.prototype, protoProps);
      if (staticProps) _defineProperties(Constructor, staticProps);
      Object.defineProperty(Constructor, "prototype", { writable: false });
      return Constructor;
    }
    __name(_createClass, "_createClass");
    function _toPropertyKey(arg) {
      var key = _toPrimitive(arg, "string");
      return typeof key === "symbol" ? key : String(key);
    }
    __name(_toPropertyKey, "_toPropertyKey");
    function _toPrimitive(input, hint) {
      if (typeof input !== "object" || input === null) return input;
      var prim = input[Symbol.toPrimitive];
      if (prim !== void 0) {
        var res = prim.call(input, hint || "default");
        if (typeof res !== "object") return res;
        throw new TypeError("@@toPrimitive must return a primitive value.");
      }
      return (hint === "string" ? String : Number)(input);
    }
    __name(_toPrimitive, "_toPrimitive");
    var _require = require("buffer");
    var Buffer2 = _require.Buffer;
    var _require2 = require("util");
    var inspect = _require2.inspect;
    var custom = inspect && inspect.custom || "inspect";
    function copyBuffer(src, target, offset) {
      Buffer2.prototype.copy.call(src, target, offset);
    }
    __name(copyBuffer, "copyBuffer");
    module2.exports = /* @__PURE__ */ (function() {
      function BufferList() {
        _classCallCheck(this, BufferList);
        this.head = null;
        this.tail = null;
        this.length = 0;
      }
      __name(BufferList, "BufferList");
      _createClass(BufferList, [{
        key: "push",
        value: /* @__PURE__ */ __name(function push(v) {
          var entry = {
            data: v,
            next: null
          };
          if (this.length > 0) this.tail.next = entry;
          else this.head = entry;
          this.tail = entry;
          ++this.length;
        }, "push")
      }, {
        key: "unshift",
        value: /* @__PURE__ */ __name(function unshift(v) {
          var entry = {
            data: v,
            next: this.head
          };
          if (this.length === 0) this.tail = entry;
          this.head = entry;
          ++this.length;
        }, "unshift")
      }, {
        key: "shift",
        value: /* @__PURE__ */ __name(function shift() {
          if (this.length === 0) return;
          var ret = this.head.data;
          if (this.length === 1) this.head = this.tail = null;
          else this.head = this.head.next;
          --this.length;
          return ret;
        }, "shift")
      }, {
        key: "clear",
        value: /* @__PURE__ */ __name(function clear() {
          this.head = this.tail = null;
          this.length = 0;
        }, "clear")
      }, {
        key: "join",
        value: /* @__PURE__ */ __name(function join(s) {
          if (this.length === 0) return "";
          var p = this.head;
          var ret = "" + p.data;
          while (p = p.next) ret += s + p.data;
          return ret;
        }, "join")
      }, {
        key: "concat",
        value: /* @__PURE__ */ __name(function concat(n) {
          if (this.length === 0) return Buffer2.alloc(0);
          var ret = Buffer2.allocUnsafe(n >>> 0);
          var p = this.head;
          var i = 0;
          while (p) {
            copyBuffer(p.data, ret, i);
            i += p.data.length;
            p = p.next;
          }
          return ret;
        }, "concat")
        // Consumes a specified amount of bytes or characters from the buffered data.
      }, {
        key: "consume",
        value: /* @__PURE__ */ __name(function consume(n, hasStrings) {
          var ret;
          if (n < this.head.data.length) {
            ret = this.head.data.slice(0, n);
            this.head.data = this.head.data.slice(n);
          } else if (n === this.head.data.length) {
            ret = this.shift();
          } else {
            ret = hasStrings ? this._getString(n) : this._getBuffer(n);
          }
          return ret;
        }, "consume")
      }, {
        key: "first",
        value: /* @__PURE__ */ __name(function first() {
          return this.head.data;
        }, "first")
        // Consumes a specified amount of characters from the buffered data.
      }, {
        key: "_getString",
        value: /* @__PURE__ */ __name(function _getString(n) {
          var p = this.head;
          var c = 1;
          var ret = p.data;
          n -= ret.length;
          while (p = p.next) {
            var str = p.data;
            var nb = n > str.length ? str.length : n;
            if (nb === str.length) ret += str;
            else ret += str.slice(0, n);
            n -= nb;
            if (n === 0) {
              if (nb === str.length) {
                ++c;
                if (p.next) this.head = p.next;
                else this.head = this.tail = null;
              } else {
                this.head = p;
                p.data = str.slice(nb);
              }
              break;
            }
            ++c;
          }
          this.length -= c;
          return ret;
        }, "_getString")
        // Consumes a specified amount of bytes from the buffered data.
      }, {
        key: "_getBuffer",
        value: /* @__PURE__ */ __name(function _getBuffer(n) {
          var ret = Buffer2.allocUnsafe(n);
          var p = this.head;
          var c = 1;
          p.data.copy(ret);
          n -= p.data.length;
          while (p = p.next) {
            var buf = p.data;
            var nb = n > buf.length ? buf.length : n;
            buf.copy(ret, ret.length - n, 0, nb);
            n -= nb;
            if (n === 0) {
              if (nb === buf.length) {
                ++c;
                if (p.next) this.head = p.next;
                else this.head = this.tail = null;
              } else {
                this.head = p;
                p.data = buf.slice(nb);
              }
              break;
            }
            ++c;
          }
          this.length -= c;
          return ret;
        }, "_getBuffer")
        // Make sure the linked list only shows the minimal necessary information.
      }, {
        key: custom,
        value: /* @__PURE__ */ __name(function value(_, options) {
          return inspect(this, _objectSpread(_objectSpread({}, options), {}, {
            // Only inspect one level.
            depth: 0,
            // It should not recurse.
            customInspect: false
          }));
        }, "value")
      }]);
      return BufferList;
    })();
  }
});

// node_modules/winston/node_modules/readable-stream/lib/internal/streams/destroy.js
var require_destroy2 = __commonJS({
  "node_modules/winston/node_modules/readable-stream/lib/internal/streams/destroy.js"(exports2, module2) {
    "use strict";
    function destroy(err, cb) {
      var _this = this;
      var readableDestroyed = this._readableState && this._readableState.destroyed;
      var writableDestroyed = this._writableState && this._writableState.destroyed;
      if (readableDestroyed || writableDestroyed) {
        if (cb) {
          cb(err);
        } else if (err) {
          if (!this._writableState) {
            process.nextTick(emitErrorNT, this, err);
          } else if (!this._writableState.errorEmitted) {
            this._writableState.errorEmitted = true;
            process.nextTick(emitErrorNT, this, err);
          }
        }
        return this;
      }
      if (this._readableState) {
        this._readableState.destroyed = true;
      }
      if (this._writableState) {
        this._writableState.destroyed = true;
      }
      this._destroy(err || null, function(err2) {
        if (!cb && err2) {
          if (!_this._writableState) {
            process.nextTick(emitErrorAndCloseNT, _this, err2);
          } else if (!_this._writableState.errorEmitted) {
            _this._writableState.errorEmitted = true;
            process.nextTick(emitErrorAndCloseNT, _this, err2);
          } else {
            process.nextTick(emitCloseNT, _this);
          }
        } else if (cb) {
          process.nextTick(emitCloseNT, _this);
          cb(err2);
        } else {
          process.nextTick(emitCloseNT, _this);
        }
      });
      return this;
    }
    __name(destroy, "destroy");
    function emitErrorAndCloseNT(self2, err) {
      emitErrorNT(self2, err);
      emitCloseNT(self2);
    }
    __name(emitErrorAndCloseNT, "emitErrorAndCloseNT");
    function emitCloseNT(self2) {
      if (self2._writableState && !self2._writableState.emitClose) return;
      if (self2._readableState && !self2._readableState.emitClose) return;
      self2.emit("close");
    }
    __name(emitCloseNT, "emitCloseNT");
    function undestroy() {
      if (this._readableState) {
        this._readableState.destroyed = false;
        this._readableState.reading = false;
        this._readableState.ended = false;
        this._readableState.endEmitted = false;
      }
      if (this._writableState) {
        this._writableState.destroyed = false;
        this._writableState.ended = false;
        this._writableState.ending = false;
        this._writableState.finalCalled = false;
        this._writableState.prefinished = false;
        this._writableState.finished = false;
        this._writableState.errorEmitted = false;
      }
    }
    __name(undestroy, "undestroy");
    function emitErrorNT(self2, err) {
      self2.emit("error", err);
    }
    __name(emitErrorNT, "emitErrorNT");
    function errorOrDestroy(stream, err) {
      var rState = stream._readableState;
      var wState = stream._writableState;
      if (rState && rState.autoDestroy || wState && wState.autoDestroy) stream.destroy(err);
      else stream.emit("error", err);
    }
    __name(errorOrDestroy, "errorOrDestroy");
    module2.exports = {
      destroy,
      undestroy,
      errorOrDestroy
    };
  }
});

// node_modules/winston/node_modules/readable-stream/errors.js
var require_errors3 = __commonJS({
  "node_modules/winston/node_modules/readable-stream/errors.js"(exports2, module2) {
    "use strict";
    var codes = {};
    function createErrorType(code, message, Base) {
      if (!Base) {
        Base = Error;
      }
      function getMessage(arg1, arg2, arg3) {
        if (typeof message === "string") {
          return message;
        } else {
          return message(arg1, arg2, arg3);
        }
      }
      __name(getMessage, "getMessage");
      class NodeError extends Base {
        static {
          __name(this, "NodeError");
        }
        constructor(arg1, arg2, arg3) {
          super(getMessage(arg1, arg2, arg3));
        }
      }
      NodeError.prototype.name = Base.name;
      NodeError.prototype.code = code;
      codes[code] = NodeError;
    }
    __name(createErrorType, "createErrorType");
    function oneOf(expected, thing) {
      if (Array.isArray(expected)) {
        const len = expected.length;
        expected = expected.map((i) => String(i));
        if (len > 2) {
          return `one of ${thing} ${expected.slice(0, len - 1).join(", ")}, or ` + expected[len - 1];
        } else if (len === 2) {
          return `one of ${thing} ${expected[0]} or ${expected[1]}`;
        } else {
          return `of ${thing} ${expected[0]}`;
        }
      } else {
        return `of ${thing} ${String(expected)}`;
      }
    }
    __name(oneOf, "oneOf");
    function startsWith(str, search, pos) {
      return str.substr(!pos || pos < 0 ? 0 : +pos, search.length) === search;
    }
    __name(startsWith, "startsWith");
    function endsWith(str, search, this_len) {
      if (this_len === void 0 || this_len > str.length) {
        this_len = str.length;
      }
      return str.substring(this_len - search.length, this_len) === search;
    }
    __name(endsWith, "endsWith");
    function includes(str, search, start) {
      if (typeof start !== "number") {
        start = 0;
      }
      if (start + search.length > str.length) {
        return false;
      } else {
        return str.indexOf(search, start) !== -1;
      }
    }
    __name(includes, "includes");
    createErrorType("ERR_INVALID_OPT_VALUE", function(name, value) {
      return 'The value "' + value + '" is invalid for option "' + name + '"';
    }, TypeError);
    createErrorType("ERR_INVALID_ARG_TYPE", function(name, expected, actual) {
      let determiner;
      if (typeof expected === "string" && startsWith(expected, "not ")) {
        determiner = "must not be";
        expected = expected.replace(/^not /, "");
      } else {
        determiner = "must be";
      }
      let msg;
      if (endsWith(name, " argument")) {
        msg = `The ${name} ${determiner} ${oneOf(expected, "type")}`;
      } else {
        const type = includes(name, ".") ? "property" : "argument";
        msg = `The "${name}" ${type} ${determiner} ${oneOf(expected, "type")}`;
      }
      msg += `. Received type ${typeof actual}`;
      return msg;
    }, TypeError);
    createErrorType("ERR_STREAM_PUSH_AFTER_EOF", "stream.push() after EOF");
    createErrorType("ERR_METHOD_NOT_IMPLEMENTED", function(name) {
      return "The " + name + " method is not implemented";
    });
    createErrorType("ERR_STREAM_PREMATURE_CLOSE", "Premature close");
    createErrorType("ERR_STREAM_DESTROYED", function(name) {
      return "Cannot call " + name + " after a stream was destroyed";
    });
    createErrorType("ERR_MULTIPLE_CALLBACK", "Callback called multiple times");
    createErrorType("ERR_STREAM_CANNOT_PIPE", "Cannot pipe, not readable");
    createErrorType("ERR_STREAM_WRITE_AFTER_END", "write after end");
    createErrorType("ERR_STREAM_NULL_VALUES", "May not write null values to stream", TypeError);
    createErrorType("ERR_UNKNOWN_ENCODING", function(arg) {
      return "Unknown encoding: " + arg;
    }, TypeError);
    createErrorType("ERR_STREAM_UNSHIFT_AFTER_END_EVENT", "stream.unshift() after end event");
    module2.exports.codes = codes;
  }
});

// node_modules/winston/node_modules/readable-stream/lib/internal/streams/state.js
var require_state2 = __commonJS({
  "node_modules/winston/node_modules/readable-stream/lib/internal/streams/state.js"(exports2, module2) {
    "use strict";
    var ERR_INVALID_OPT_VALUE = require_errors3().codes.ERR_INVALID_OPT_VALUE;
    function highWaterMarkFrom(options, isDuplex, duplexKey) {
      return options.highWaterMark != null ? options.highWaterMark : isDuplex ? options[duplexKey] : null;
    }
    __name(highWaterMarkFrom, "highWaterMarkFrom");
    function getHighWaterMark(state2, options, duplexKey, isDuplex) {
      var hwm = highWaterMarkFrom(options, isDuplex, duplexKey);
      if (hwm != null) {
        if (!(isFinite(hwm) && Math.floor(hwm) === hwm) || hwm < 0) {
          var name = isDuplex ? duplexKey : "highWaterMark";
          throw new ERR_INVALID_OPT_VALUE(name, hwm);
        }
        return Math.floor(hwm);
      }
      return state2.objectMode ? 16 : 16 * 1024;
    }
    __name(getHighWaterMark, "getHighWaterMark");
    module2.exports = {
      getHighWaterMark
    };
  }
});

// node_modules/winston/node_modules/readable-stream/lib/_stream_writable.js
var require_stream_writable2 = __commonJS({
  "node_modules/winston/node_modules/readable-stream/lib/_stream_writable.js"(exports2, module2) {
    "use strict";
    module2.exports = Writable;
    function CorkedRequest(state2) {
      var _this = this;
      this.next = null;
      this.entry = null;
      this.finish = function() {
        onCorkedFinish(_this, state2);
      };
    }
    __name(CorkedRequest, "CorkedRequest");
    var Duplex;
    Writable.WritableState = WritableState;
    var internalUtil = {
      deprecate: require_node()
    };
    var Stream = require_stream2();
    var Buffer2 = require("buffer").Buffer;
    var OurUint8Array = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : {}).Uint8Array || function() {
    };
    function _uint8ArrayToBuffer(chunk) {
      return Buffer2.from(chunk);
    }
    __name(_uint8ArrayToBuffer, "_uint8ArrayToBuffer");
    function _isUint8Array(obj) {
      return Buffer2.isBuffer(obj) || obj instanceof OurUint8Array;
    }
    __name(_isUint8Array, "_isUint8Array");
    var destroyImpl = require_destroy2();
    var _require = require_state2();
    var getHighWaterMark = _require.getHighWaterMark;
    var _require$codes = require_errors3().codes;
    var ERR_INVALID_ARG_TYPE = _require$codes.ERR_INVALID_ARG_TYPE;
    var ERR_METHOD_NOT_IMPLEMENTED = _require$codes.ERR_METHOD_NOT_IMPLEMENTED;
    var ERR_MULTIPLE_CALLBACK = _require$codes.ERR_MULTIPLE_CALLBACK;
    var ERR_STREAM_CANNOT_PIPE = _require$codes.ERR_STREAM_CANNOT_PIPE;
    var ERR_STREAM_DESTROYED = _require$codes.ERR_STREAM_DESTROYED;
    var ERR_STREAM_NULL_VALUES = _require$codes.ERR_STREAM_NULL_VALUES;
    var ERR_STREAM_WRITE_AFTER_END = _require$codes.ERR_STREAM_WRITE_AFTER_END;
    var ERR_UNKNOWN_ENCODING = _require$codes.ERR_UNKNOWN_ENCODING;
    var errorOrDestroy = destroyImpl.errorOrDestroy;
    require_inherits()(Writable, Stream);
    function nop() {
    }
    __name(nop, "nop");
    function WritableState(options, stream, isDuplex) {
      Duplex = Duplex || require_stream_duplex2();
      options = options || {};
      if (typeof isDuplex !== "boolean") isDuplex = stream instanceof Duplex;
      this.objectMode = !!options.objectMode;
      if (isDuplex) this.objectMode = this.objectMode || !!options.writableObjectMode;
      this.highWaterMark = getHighWaterMark(this, options, "writableHighWaterMark", isDuplex);
      this.finalCalled = false;
      this.needDrain = false;
      this.ending = false;
      this.ended = false;
      this.finished = false;
      this.destroyed = false;
      var noDecode = options.decodeStrings === false;
      this.decodeStrings = !noDecode;
      this.defaultEncoding = options.defaultEncoding || "utf8";
      this.length = 0;
      this.writing = false;
      this.corked = 0;
      this.sync = true;
      this.bufferProcessing = false;
      this.onwrite = function(er) {
        onwrite(stream, er);
      };
      this.writecb = null;
      this.writelen = 0;
      this.bufferedRequest = null;
      this.lastBufferedRequest = null;
      this.pendingcb = 0;
      this.prefinished = false;
      this.errorEmitted = false;
      this.emitClose = options.emitClose !== false;
      this.autoDestroy = !!options.autoDestroy;
      this.bufferedRequestCount = 0;
      this.corkedRequestsFree = new CorkedRequest(this);
    }
    __name(WritableState, "WritableState");
    WritableState.prototype.getBuffer = /* @__PURE__ */ __name(function getBuffer() {
      var current = this.bufferedRequest;
      var out = [];
      while (current) {
        out.push(current);
        current = current.next;
      }
      return out;
    }, "getBuffer");
    (function() {
      try {
        Object.defineProperty(WritableState.prototype, "buffer", {
          get: internalUtil.deprecate(/* @__PURE__ */ __name(function writableStateBufferGetter() {
            return this.getBuffer();
          }, "writableStateBufferGetter"), "_writableState.buffer is deprecated. Use _writableState.getBuffer instead.", "DEP0003")
        });
      } catch (_) {
      }
    })();
    var realHasInstance;
    if (typeof Symbol === "function" && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] === "function") {
      realHasInstance = Function.prototype[Symbol.hasInstance];
      Object.defineProperty(Writable, Symbol.hasInstance, {
        value: /* @__PURE__ */ __name(function value(object) {
          if (realHasInstance.call(this, object)) return true;
          if (this !== Writable) return false;
          return object && object._writableState instanceof WritableState;
        }, "value")
      });
    } else {
      realHasInstance = /* @__PURE__ */ __name(function realHasInstance2(object) {
        return object instanceof this;
      }, "realHasInstance");
    }
    function Writable(options) {
      Duplex = Duplex || require_stream_duplex2();
      var isDuplex = this instanceof Duplex;
      if (!isDuplex && !realHasInstance.call(Writable, this)) return new Writable(options);
      this._writableState = new WritableState(options, this, isDuplex);
      this.writable = true;
      if (options) {
        if (typeof options.write === "function") this._write = options.write;
        if (typeof options.writev === "function") this._writev = options.writev;
        if (typeof options.destroy === "function") this._destroy = options.destroy;
        if (typeof options.final === "function") this._final = options.final;
      }
      Stream.call(this);
    }
    __name(Writable, "Writable");
    Writable.prototype.pipe = function() {
      errorOrDestroy(this, new ERR_STREAM_CANNOT_PIPE());
    };
    function writeAfterEnd(stream, cb) {
      var er = new ERR_STREAM_WRITE_AFTER_END();
      errorOrDestroy(stream, er);
      process.nextTick(cb, er);
    }
    __name(writeAfterEnd, "writeAfterEnd");
    function validChunk(stream, state2, chunk, cb) {
      var er;
      if (chunk === null) {
        er = new ERR_STREAM_NULL_VALUES();
      } else if (typeof chunk !== "string" && !state2.objectMode) {
        er = new ERR_INVALID_ARG_TYPE("chunk", ["string", "Buffer"], chunk);
      }
      if (er) {
        errorOrDestroy(stream, er);
        process.nextTick(cb, er);
        return false;
      }
      return true;
    }
    __name(validChunk, "validChunk");
    Writable.prototype.write = function(chunk, encoding, cb) {
      var state2 = this._writableState;
      var ret = false;
      var isBuf = !state2.objectMode && _isUint8Array(chunk);
      if (isBuf && !Buffer2.isBuffer(chunk)) {
        chunk = _uint8ArrayToBuffer(chunk);
      }
      if (typeof encoding === "function") {
        cb = encoding;
        encoding = null;
      }
      if (isBuf) encoding = "buffer";
      else if (!encoding) encoding = state2.defaultEncoding;
      if (typeof cb !== "function") cb = nop;
      if (state2.ending) writeAfterEnd(this, cb);
      else if (isBuf || validChunk(this, state2, chunk, cb)) {
        state2.pendingcb++;
        ret = writeOrBuffer(this, state2, isBuf, chunk, encoding, cb);
      }
      return ret;
    };
    Writable.prototype.cork = function() {
      this._writableState.corked++;
    };
    Writable.prototype.uncork = function() {
      var state2 = this._writableState;
      if (state2.corked) {
        state2.corked--;
        if (!state2.writing && !state2.corked && !state2.bufferProcessing && state2.bufferedRequest) clearBuffer(this, state2);
      }
    };
    Writable.prototype.setDefaultEncoding = /* @__PURE__ */ __name(function setDefaultEncoding(encoding) {
      if (typeof encoding === "string") encoding = encoding.toLowerCase();
      if (!(["hex", "utf8", "utf-8", "ascii", "binary", "base64", "ucs2", "ucs-2", "utf16le", "utf-16le", "raw"].indexOf((encoding + "").toLowerCase()) > -1)) throw new ERR_UNKNOWN_ENCODING(encoding);
      this._writableState.defaultEncoding = encoding;
      return this;
    }, "setDefaultEncoding");
    Object.defineProperty(Writable.prototype, "writableBuffer", {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: /* @__PURE__ */ __name(function get() {
        return this._writableState && this._writableState.getBuffer();
      }, "get")
    });
    function decodeChunk(state2, chunk, encoding) {
      if (!state2.objectMode && state2.decodeStrings !== false && typeof chunk === "string") {
        chunk = Buffer2.from(chunk, encoding);
      }
      return chunk;
    }
    __name(decodeChunk, "decodeChunk");
    Object.defineProperty(Writable.prototype, "writableHighWaterMark", {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: /* @__PURE__ */ __name(function get() {
        return this._writableState.highWaterMark;
      }, "get")
    });
    function writeOrBuffer(stream, state2, isBuf, chunk, encoding, cb) {
      if (!isBuf) {
        var newChunk = decodeChunk(state2, chunk, encoding);
        if (chunk !== newChunk) {
          isBuf = true;
          encoding = "buffer";
          chunk = newChunk;
        }
      }
      var len = state2.objectMode ? 1 : chunk.length;
      state2.length += len;
      var ret = state2.length < state2.highWaterMark;
      if (!ret) state2.needDrain = true;
      if (state2.writing || state2.corked) {
        var last = state2.lastBufferedRequest;
        state2.lastBufferedRequest = {
          chunk,
          encoding,
          isBuf,
          callback: cb,
          next: null
        };
        if (last) {
          last.next = state2.lastBufferedRequest;
        } else {
          state2.bufferedRequest = state2.lastBufferedRequest;
        }
        state2.bufferedRequestCount += 1;
      } else {
        doWrite(stream, state2, false, len, chunk, encoding, cb);
      }
      return ret;
    }
    __name(writeOrBuffer, "writeOrBuffer");
    function doWrite(stream, state2, writev, len, chunk, encoding, cb) {
      state2.writelen = len;
      state2.writecb = cb;
      state2.writing = true;
      state2.sync = true;
      if (state2.destroyed) state2.onwrite(new ERR_STREAM_DESTROYED("write"));
      else if (writev) stream._writev(chunk, state2.onwrite);
      else stream._write(chunk, encoding, state2.onwrite);
      state2.sync = false;
    }
    __name(doWrite, "doWrite");
    function onwriteError(stream, state2, sync, er, cb) {
      --state2.pendingcb;
      if (sync) {
        process.nextTick(cb, er);
        process.nextTick(finishMaybe, stream, state2);
        stream._writableState.errorEmitted = true;
        errorOrDestroy(stream, er);
      } else {
        cb(er);
        stream._writableState.errorEmitted = true;
        errorOrDestroy(stream, er);
        finishMaybe(stream, state2);
      }
    }
    __name(onwriteError, "onwriteError");
    function onwriteStateUpdate(state2) {
      state2.writing = false;
      state2.writecb = null;
      state2.length -= state2.writelen;
      state2.writelen = 0;
    }
    __name(onwriteStateUpdate, "onwriteStateUpdate");
    function onwrite(stream, er) {
      var state2 = stream._writableState;
      var sync = state2.sync;
      var cb = state2.writecb;
      if (typeof cb !== "function") throw new ERR_MULTIPLE_CALLBACK();
      onwriteStateUpdate(state2);
      if (er) onwriteError(stream, state2, sync, er, cb);
      else {
        var finished = needFinish(state2) || stream.destroyed;
        if (!finished && !state2.corked && !state2.bufferProcessing && state2.bufferedRequest) {
          clearBuffer(stream, state2);
        }
        if (sync) {
          process.nextTick(afterWrite, stream, state2, finished, cb);
        } else {
          afterWrite(stream, state2, finished, cb);
        }
      }
    }
    __name(onwrite, "onwrite");
    function afterWrite(stream, state2, finished, cb) {
      if (!finished) onwriteDrain(stream, state2);
      state2.pendingcb--;
      cb();
      finishMaybe(stream, state2);
    }
    __name(afterWrite, "afterWrite");
    function onwriteDrain(stream, state2) {
      if (state2.length === 0 && state2.needDrain) {
        state2.needDrain = false;
        stream.emit("drain");
      }
    }
    __name(onwriteDrain, "onwriteDrain");
    function clearBuffer(stream, state2) {
      state2.bufferProcessing = true;
      var entry = state2.bufferedRequest;
      if (stream._writev && entry && entry.next) {
        var l = state2.bufferedRequestCount;
        var buffer = new Array(l);
        var holder = state2.corkedRequestsFree;
        holder.entry = entry;
        var count = 0;
        var allBuffers = true;
        while (entry) {
          buffer[count] = entry;
          if (!entry.isBuf) allBuffers = false;
          entry = entry.next;
          count += 1;
        }
        buffer.allBuffers = allBuffers;
        doWrite(stream, state2, true, state2.length, buffer, "", holder.finish);
        state2.pendingcb++;
        state2.lastBufferedRequest = null;
        if (holder.next) {
          state2.corkedRequestsFree = holder.next;
          holder.next = null;
        } else {
          state2.corkedRequestsFree = new CorkedRequest(state2);
        }
        state2.bufferedRequestCount = 0;
      } else {
        while (entry) {
          var chunk = entry.chunk;
          var encoding = entry.encoding;
          var cb = entry.callback;
          var len = state2.objectMode ? 1 : chunk.length;
          doWrite(stream, state2, false, len, chunk, encoding, cb);
          entry = entry.next;
          state2.bufferedRequestCount--;
          if (state2.writing) {
            break;
          }
        }
        if (entry === null) state2.lastBufferedRequest = null;
      }
      state2.bufferedRequest = entry;
      state2.bufferProcessing = false;
    }
    __name(clearBuffer, "clearBuffer");
    Writable.prototype._write = function(chunk, encoding, cb) {
      cb(new ERR_METHOD_NOT_IMPLEMENTED("_write()"));
    };
    Writable.prototype._writev = null;
    Writable.prototype.end = function(chunk, encoding, cb) {
      var state2 = this._writableState;
      if (typeof chunk === "function") {
        cb = chunk;
        chunk = null;
        encoding = null;
      } else if (typeof encoding === "function") {
        cb = encoding;
        encoding = null;
      }
      if (chunk !== null && chunk !== void 0) this.write(chunk, encoding);
      if (state2.corked) {
        state2.corked = 1;
        this.uncork();
      }
      if (!state2.ending) endWritable(this, state2, cb);
      return this;
    };
    Object.defineProperty(Writable.prototype, "writableLength", {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: /* @__PURE__ */ __name(function get() {
        return this._writableState.length;
      }, "get")
    });
    function needFinish(state2) {
      return state2.ending && state2.length === 0 && state2.bufferedRequest === null && !state2.finished && !state2.writing;
    }
    __name(needFinish, "needFinish");
    function callFinal(stream, state2) {
      stream._final(function(err) {
        state2.pendingcb--;
        if (err) {
          errorOrDestroy(stream, err);
        }
        state2.prefinished = true;
        stream.emit("prefinish");
        finishMaybe(stream, state2);
      });
    }
    __name(callFinal, "callFinal");
    function prefinish(stream, state2) {
      if (!state2.prefinished && !state2.finalCalled) {
        if (typeof stream._final === "function" && !state2.destroyed) {
          state2.pendingcb++;
          state2.finalCalled = true;
          process.nextTick(callFinal, stream, state2);
        } else {
          state2.prefinished = true;
          stream.emit("prefinish");
        }
      }
    }
    __name(prefinish, "prefinish");
    function finishMaybe(stream, state2) {
      var need = needFinish(state2);
      if (need) {
        prefinish(stream, state2);
        if (state2.pendingcb === 0) {
          state2.finished = true;
          stream.emit("finish");
          if (state2.autoDestroy) {
            var rState = stream._readableState;
            if (!rState || rState.autoDestroy && rState.endEmitted) {
              stream.destroy();
            }
          }
        }
      }
      return need;
    }
    __name(finishMaybe, "finishMaybe");
    function endWritable(stream, state2, cb) {
      state2.ending = true;
      finishMaybe(stream, state2);
      if (cb) {
        if (state2.finished) process.nextTick(cb);
        else stream.once("finish", cb);
      }
      state2.ended = true;
      stream.writable = false;
    }
    __name(endWritable, "endWritable");
    function onCorkedFinish(corkReq, state2, err) {
      var entry = corkReq.entry;
      corkReq.entry = null;
      while (entry) {
        var cb = entry.callback;
        state2.pendingcb--;
        cb(err);
        entry = entry.next;
      }
      state2.corkedRequestsFree.next = corkReq;
    }
    __name(onCorkedFinish, "onCorkedFinish");
    Object.defineProperty(Writable.prototype, "destroyed", {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: /* @__PURE__ */ __name(function get() {
        if (this._writableState === void 0) {
          return false;
        }
        return this._writableState.destroyed;
      }, "get"),
      set: /* @__PURE__ */ __name(function set(value) {
        if (!this._writableState) {
          return;
        }
        this._writableState.destroyed = value;
      }, "set")
    });
    Writable.prototype.destroy = destroyImpl.destroy;
    Writable.prototype._undestroy = destroyImpl.undestroy;
    Writable.prototype._destroy = function(err, cb) {
      cb(err);
    };
  }
});

// node_modules/winston/node_modules/readable-stream/lib/_stream_duplex.js
var require_stream_duplex2 = __commonJS({
  "node_modules/winston/node_modules/readable-stream/lib/_stream_duplex.js"(exports2, module2) {
    "use strict";
    var objectKeys = Object.keys || function(obj) {
      var keys2 = [];
      for (var key in obj) keys2.push(key);
      return keys2;
    };
    module2.exports = Duplex;
    var Readable = require_stream_readable2();
    var Writable = require_stream_writable2();
    require_inherits()(Duplex, Readable);
    {
      keys = objectKeys(Writable.prototype);
      for (v = 0; v < keys.length; v++) {
        method = keys[v];
        if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
      }
    }
    var keys;
    var method;
    var v;
    function Duplex(options) {
      if (!(this instanceof Duplex)) return new Duplex(options);
      Readable.call(this, options);
      Writable.call(this, options);
      this.allowHalfOpen = true;
      if (options) {
        if (options.readable === false) this.readable = false;
        if (options.writable === false) this.writable = false;
        if (options.allowHalfOpen === false) {
          this.allowHalfOpen = false;
          this.once("end", onend);
        }
      }
    }
    __name(Duplex, "Duplex");
    Object.defineProperty(Duplex.prototype, "writableHighWaterMark", {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: /* @__PURE__ */ __name(function get() {
        return this._writableState.highWaterMark;
      }, "get")
    });
    Object.defineProperty(Duplex.prototype, "writableBuffer", {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: /* @__PURE__ */ __name(function get() {
        return this._writableState && this._writableState.getBuffer();
      }, "get")
    });
    Object.defineProperty(Duplex.prototype, "writableLength", {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: /* @__PURE__ */ __name(function get() {
        return this._writableState.length;
      }, "get")
    });
    function onend() {
      if (this._writableState.ended) return;
      process.nextTick(onEndNT, this);
    }
    __name(onend, "onend");
    function onEndNT(self2) {
      self2.end();
    }
    __name(onEndNT, "onEndNT");
    Object.defineProperty(Duplex.prototype, "destroyed", {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: /* @__PURE__ */ __name(function get() {
        if (this._readableState === void 0 || this._writableState === void 0) {
          return false;
        }
        return this._readableState.destroyed && this._writableState.destroyed;
      }, "get"),
      set: /* @__PURE__ */ __name(function set(value) {
        if (this._readableState === void 0 || this._writableState === void 0) {
          return;
        }
        this._readableState.destroyed = value;
        this._writableState.destroyed = value;
      }, "set")
    });
  }
});

// node_modules/winston/node_modules/readable-stream/lib/internal/streams/end-of-stream.js
var require_end_of_stream2 = __commonJS({
  "node_modules/winston/node_modules/readable-stream/lib/internal/streams/end-of-stream.js"(exports2, module2) {
    "use strict";
    var ERR_STREAM_PREMATURE_CLOSE = require_errors3().codes.ERR_STREAM_PREMATURE_CLOSE;
    function once(callback) {
      var called = false;
      return function() {
        if (called) return;
        called = true;
        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }
        callback.apply(this, args);
      };
    }
    __name(once, "once");
    function noop() {
    }
    __name(noop, "noop");
    function isRequest(stream) {
      return stream.setHeader && typeof stream.abort === "function";
    }
    __name(isRequest, "isRequest");
    function eos(stream, opts, callback) {
      if (typeof opts === "function") return eos(stream, null, opts);
      if (!opts) opts = {};
      callback = once(callback || noop);
      var readable = opts.readable || opts.readable !== false && stream.readable;
      var writable = opts.writable || opts.writable !== false && stream.writable;
      var onlegacyfinish = /* @__PURE__ */ __name(function onlegacyfinish2() {
        if (!stream.writable) onfinish();
      }, "onlegacyfinish");
      var writableEnded = stream._writableState && stream._writableState.finished;
      var onfinish = /* @__PURE__ */ __name(function onfinish2() {
        writable = false;
        writableEnded = true;
        if (!readable) callback.call(stream);
      }, "onfinish");
      var readableEnded = stream._readableState && stream._readableState.endEmitted;
      var onend = /* @__PURE__ */ __name(function onend2() {
        readable = false;
        readableEnded = true;
        if (!writable) callback.call(stream);
      }, "onend");
      var onerror = /* @__PURE__ */ __name(function onerror2(err) {
        callback.call(stream, err);
      }, "onerror");
      var onclose = /* @__PURE__ */ __name(function onclose2() {
        var err;
        if (readable && !readableEnded) {
          if (!stream._readableState || !stream._readableState.ended) err = new ERR_STREAM_PREMATURE_CLOSE();
          return callback.call(stream, err);
        }
        if (writable && !writableEnded) {
          if (!stream._writableState || !stream._writableState.ended) err = new ERR_STREAM_PREMATURE_CLOSE();
          return callback.call(stream, err);
        }
      }, "onclose");
      var onrequest = /* @__PURE__ */ __name(function onrequest2() {
        stream.req.on("finish", onfinish);
      }, "onrequest");
      if (isRequest(stream)) {
        stream.on("complete", onfinish);
        stream.on("abort", onclose);
        if (stream.req) onrequest();
        else stream.on("request", onrequest);
      } else if (writable && !stream._writableState) {
        stream.on("end", onlegacyfinish);
        stream.on("close", onlegacyfinish);
      }
      stream.on("end", onend);
      stream.on("finish", onfinish);
      if (opts.error !== false) stream.on("error", onerror);
      stream.on("close", onclose);
      return function() {
        stream.removeListener("complete", onfinish);
        stream.removeListener("abort", onclose);
        stream.removeListener("request", onrequest);
        if (stream.req) stream.req.removeListener("finish", onfinish);
        stream.removeListener("end", onlegacyfinish);
        stream.removeListener("close", onlegacyfinish);
        stream.removeListener("finish", onfinish);
        stream.removeListener("end", onend);
        stream.removeListener("error", onerror);
        stream.removeListener("close", onclose);
      };
    }
    __name(eos, "eos");
    module2.exports = eos;
  }
});

// node_modules/winston/node_modules/readable-stream/lib/internal/streams/async_iterator.js
var require_async_iterator2 = __commonJS({
  "node_modules/winston/node_modules/readable-stream/lib/internal/streams/async_iterator.js"(exports2, module2) {
    "use strict";
    var _Object$setPrototypeO;
    function _defineProperty(obj, key, value) {
      key = _toPropertyKey(key);
      if (key in obj) {
        Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
      } else {
        obj[key] = value;
      }
      return obj;
    }
    __name(_defineProperty, "_defineProperty");
    function _toPropertyKey(arg) {
      var key = _toPrimitive(arg, "string");
      return typeof key === "symbol" ? key : String(key);
    }
    __name(_toPropertyKey, "_toPropertyKey");
    function _toPrimitive(input, hint) {
      if (typeof input !== "object" || input === null) return input;
      var prim = input[Symbol.toPrimitive];
      if (prim !== void 0) {
        var res = prim.call(input, hint || "default");
        if (typeof res !== "object") return res;
        throw new TypeError("@@toPrimitive must return a primitive value.");
      }
      return (hint === "string" ? String : Number)(input);
    }
    __name(_toPrimitive, "_toPrimitive");
    var finished = require_end_of_stream2();
    var kLastResolve = /* @__PURE__ */ Symbol("lastResolve");
    var kLastReject = /* @__PURE__ */ Symbol("lastReject");
    var kError = /* @__PURE__ */ Symbol("error");
    var kEnded = /* @__PURE__ */ Symbol("ended");
    var kLastPromise = /* @__PURE__ */ Symbol("lastPromise");
    var kHandlePromise = /* @__PURE__ */ Symbol("handlePromise");
    var kStream = /* @__PURE__ */ Symbol("stream");
    function createIterResult(value, done) {
      return {
        value,
        done
      };
    }
    __name(createIterResult, "createIterResult");
    function readAndResolve(iter) {
      var resolve = iter[kLastResolve];
      if (resolve !== null) {
        var data = iter[kStream].read();
        if (data !== null) {
          iter[kLastPromise] = null;
          iter[kLastResolve] = null;
          iter[kLastReject] = null;
          resolve(createIterResult(data, false));
        }
      }
    }
    __name(readAndResolve, "readAndResolve");
    function onReadable(iter) {
      process.nextTick(readAndResolve, iter);
    }
    __name(onReadable, "onReadable");
    function wrapForNext(lastPromise, iter) {
      return function(resolve, reject) {
        lastPromise.then(function() {
          if (iter[kEnded]) {
            resolve(createIterResult(void 0, true));
            return;
          }
          iter[kHandlePromise](resolve, reject);
        }, reject);
      };
    }
    __name(wrapForNext, "wrapForNext");
    var AsyncIteratorPrototype = Object.getPrototypeOf(function() {
    });
    var ReadableStreamAsyncIteratorPrototype = Object.setPrototypeOf((_Object$setPrototypeO = {
      get stream() {
        return this[kStream];
      },
      next: /* @__PURE__ */ __name(function next() {
        var _this = this;
        var error = this[kError];
        if (error !== null) {
          return Promise.reject(error);
        }
        if (this[kEnded]) {
          return Promise.resolve(createIterResult(void 0, true));
        }
        if (this[kStream].destroyed) {
          return new Promise(function(resolve, reject) {
            process.nextTick(function() {
              if (_this[kError]) {
                reject(_this[kError]);
              } else {
                resolve(createIterResult(void 0, true));
              }
            });
          });
        }
        var lastPromise = this[kLastPromise];
        var promise;
        if (lastPromise) {
          promise = new Promise(wrapForNext(lastPromise, this));
        } else {
          var data = this[kStream].read();
          if (data !== null) {
            return Promise.resolve(createIterResult(data, false));
          }
          promise = new Promise(this[kHandlePromise]);
        }
        this[kLastPromise] = promise;
        return promise;
      }, "next")
    }, _defineProperty(_Object$setPrototypeO, Symbol.asyncIterator, function() {
      return this;
    }), _defineProperty(_Object$setPrototypeO, "return", /* @__PURE__ */ __name(function _return() {
      var _this2 = this;
      return new Promise(function(resolve, reject) {
        _this2[kStream].destroy(null, function(err) {
          if (err) {
            reject(err);
            return;
          }
          resolve(createIterResult(void 0, true));
        });
      });
    }, "_return")), _Object$setPrototypeO), AsyncIteratorPrototype);
    var createReadableStreamAsyncIterator = /* @__PURE__ */ __name(function createReadableStreamAsyncIterator2(stream) {
      var _Object$create;
      var iterator = Object.create(ReadableStreamAsyncIteratorPrototype, (_Object$create = {}, _defineProperty(_Object$create, kStream, {
        value: stream,
        writable: true
      }), _defineProperty(_Object$create, kLastResolve, {
        value: null,
        writable: true
      }), _defineProperty(_Object$create, kLastReject, {
        value: null,
        writable: true
      }), _defineProperty(_Object$create, kError, {
        value: null,
        writable: true
      }), _defineProperty(_Object$create, kEnded, {
        value: stream._readableState.endEmitted,
        writable: true
      }), _defineProperty(_Object$create, kHandlePromise, {
        value: /* @__PURE__ */ __name(function value(resolve, reject) {
          var data = iterator[kStream].read();
          if (data) {
            iterator[kLastPromise] = null;
            iterator[kLastResolve] = null;
            iterator[kLastReject] = null;
            resolve(createIterResult(data, false));
          } else {
            iterator[kLastResolve] = resolve;
            iterator[kLastReject] = reject;
          }
        }, "value"),
        writable: true
      }), _Object$create));
      iterator[kLastPromise] = null;
      finished(stream, function(err) {
        if (err && err.code !== "ERR_STREAM_PREMATURE_CLOSE") {
          var reject = iterator[kLastReject];
          if (reject !== null) {
            iterator[kLastPromise] = null;
            iterator[kLastResolve] = null;
            iterator[kLastReject] = null;
            reject(err);
          }
          iterator[kError] = err;
          return;
        }
        var resolve = iterator[kLastResolve];
        if (resolve !== null) {
          iterator[kLastPromise] = null;
          iterator[kLastResolve] = null;
          iterator[kLastReject] = null;
          resolve(createIterResult(void 0, true));
        }
        iterator[kEnded] = true;
      });
      stream.on("readable", onReadable.bind(null, iterator));
      return iterator;
    }, "createReadableStreamAsyncIterator");
    module2.exports = createReadableStreamAsyncIterator;
  }
});

// node_modules/winston/node_modules/readable-stream/lib/internal/streams/from.js
var require_from2 = __commonJS({
  "node_modules/winston/node_modules/readable-stream/lib/internal/streams/from.js"(exports2, module2) {
    "use strict";
    function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
      try {
        var info = gen[key](arg);
        var value = info.value;
      } catch (error) {
        reject(error);
        return;
      }
      if (info.done) {
        resolve(value);
      } else {
        Promise.resolve(value).then(_next, _throw);
      }
    }
    __name(asyncGeneratorStep, "asyncGeneratorStep");
    function _asyncToGenerator(fn) {
      return function() {
        var self2 = this, args = arguments;
        return new Promise(function(resolve, reject) {
          var gen = fn.apply(self2, args);
          function _next(value) {
            asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
          }
          __name(_next, "_next");
          function _throw(err) {
            asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
          }
          __name(_throw, "_throw");
          _next(void 0);
        });
      };
    }
    __name(_asyncToGenerator, "_asyncToGenerator");
    function ownKeys(object, enumerableOnly) {
      var keys = Object.keys(object);
      if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        enumerableOnly && (symbols = symbols.filter(function(sym) {
          return Object.getOwnPropertyDescriptor(object, sym).enumerable;
        })), keys.push.apply(keys, symbols);
      }
      return keys;
    }
    __name(ownKeys, "ownKeys");
    function _objectSpread(target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = null != arguments[i] ? arguments[i] : {};
        i % 2 ? ownKeys(Object(source), true).forEach(function(key) {
          _defineProperty(target, key, source[key]);
        }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function(key) {
          Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
      }
      return target;
    }
    __name(_objectSpread, "_objectSpread");
    function _defineProperty(obj, key, value) {
      key = _toPropertyKey(key);
      if (key in obj) {
        Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
      } else {
        obj[key] = value;
      }
      return obj;
    }
    __name(_defineProperty, "_defineProperty");
    function _toPropertyKey(arg) {
      var key = _toPrimitive(arg, "string");
      return typeof key === "symbol" ? key : String(key);
    }
    __name(_toPropertyKey, "_toPropertyKey");
    function _toPrimitive(input, hint) {
      if (typeof input !== "object" || input === null) return input;
      var prim = input[Symbol.toPrimitive];
      if (prim !== void 0) {
        var res = prim.call(input, hint || "default");
        if (typeof res !== "object") return res;
        throw new TypeError("@@toPrimitive must return a primitive value.");
      }
      return (hint === "string" ? String : Number)(input);
    }
    __name(_toPrimitive, "_toPrimitive");
    var ERR_INVALID_ARG_TYPE = require_errors3().codes.ERR_INVALID_ARG_TYPE;
    function from(Readable, iterable, opts) {
      var iterator;
      if (iterable && typeof iterable.next === "function") {
        iterator = iterable;
      } else if (iterable && iterable[Symbol.asyncIterator]) iterator = iterable[Symbol.asyncIterator]();
      else if (iterable && iterable[Symbol.iterator]) iterator = iterable[Symbol.iterator]();
      else throw new ERR_INVALID_ARG_TYPE("iterable", ["Iterable"], iterable);
      var readable = new Readable(_objectSpread({
        objectMode: true
      }, opts));
      var reading = false;
      readable._read = function() {
        if (!reading) {
          reading = true;
          next();
        }
      };
      function next() {
        return _next2.apply(this, arguments);
      }
      __name(next, "next");
      function _next2() {
        _next2 = _asyncToGenerator(function* () {
          try {
            var _yield$iterator$next = yield iterator.next(), value = _yield$iterator$next.value, done = _yield$iterator$next.done;
            if (done) {
              readable.push(null);
            } else if (readable.push(yield value)) {
              next();
            } else {
              reading = false;
            }
          } catch (err) {
            readable.destroy(err);
          }
        });
        return _next2.apply(this, arguments);
      }
      __name(_next2, "_next2");
      return readable;
    }
    __name(from, "from");
    module2.exports = from;
  }
});

// node_modules/winston/node_modules/readable-stream/lib/_stream_readable.js
var require_stream_readable2 = __commonJS({
  "node_modules/winston/node_modules/readable-stream/lib/_stream_readable.js"(exports2, module2) {
    "use strict";
    module2.exports = Readable;
    var Duplex;
    Readable.ReadableState = ReadableState;
    var EE = require("events").EventEmitter;
    var EElistenerCount = /* @__PURE__ */ __name(function EElistenerCount2(emitter, type) {
      return emitter.listeners(type).length;
    }, "EElistenerCount");
    var Stream = require_stream2();
    var Buffer2 = require("buffer").Buffer;
    var OurUint8Array = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : {}).Uint8Array || function() {
    };
    function _uint8ArrayToBuffer(chunk) {
      return Buffer2.from(chunk);
    }
    __name(_uint8ArrayToBuffer, "_uint8ArrayToBuffer");
    function _isUint8Array(obj) {
      return Buffer2.isBuffer(obj) || obj instanceof OurUint8Array;
    }
    __name(_isUint8Array, "_isUint8Array");
    var debugUtil = require("util");
    var debug;
    if (debugUtil && debugUtil.debuglog) {
      debug = debugUtil.debuglog("stream");
    } else {
      debug = /* @__PURE__ */ __name(function debug2() {
      }, "debug");
    }
    var BufferList = require_buffer_list2();
    var destroyImpl = require_destroy2();
    var _require = require_state2();
    var getHighWaterMark = _require.getHighWaterMark;
    var _require$codes = require_errors3().codes;
    var ERR_INVALID_ARG_TYPE = _require$codes.ERR_INVALID_ARG_TYPE;
    var ERR_STREAM_PUSH_AFTER_EOF = _require$codes.ERR_STREAM_PUSH_AFTER_EOF;
    var ERR_METHOD_NOT_IMPLEMENTED = _require$codes.ERR_METHOD_NOT_IMPLEMENTED;
    var ERR_STREAM_UNSHIFT_AFTER_END_EVENT = _require$codes.ERR_STREAM_UNSHIFT_AFTER_END_EVENT;
    var StringDecoder;
    var createReadableStreamAsyncIterator;
    var from;
    require_inherits()(Readable, Stream);
    var errorOrDestroy = destroyImpl.errorOrDestroy;
    var kProxyEvents = ["error", "close", "destroy", "pause", "resume"];
    function prependListener(emitter, event, fn) {
      if (typeof emitter.prependListener === "function") return emitter.prependListener(event, fn);
      if (!emitter._events || !emitter._events[event]) emitter.on(event, fn);
      else if (Array.isArray(emitter._events[event])) emitter._events[event].unshift(fn);
      else emitter._events[event] = [fn, emitter._events[event]];
    }
    __name(prependListener, "prependListener");
    function ReadableState(options, stream, isDuplex) {
      Duplex = Duplex || require_stream_duplex2();
      options = options || {};
      if (typeof isDuplex !== "boolean") isDuplex = stream instanceof Duplex;
      this.objectMode = !!options.objectMode;
      if (isDuplex) this.objectMode = this.objectMode || !!options.readableObjectMode;
      this.highWaterMark = getHighWaterMark(this, options, "readableHighWaterMark", isDuplex);
      this.buffer = new BufferList();
      this.length = 0;
      this.pipes = null;
      this.pipesCount = 0;
      this.flowing = null;
      this.ended = false;
      this.endEmitted = false;
      this.reading = false;
      this.sync = true;
      this.needReadable = false;
      this.emittedReadable = false;
      this.readableListening = false;
      this.resumeScheduled = false;
      this.paused = true;
      this.emitClose = options.emitClose !== false;
      this.autoDestroy = !!options.autoDestroy;
      this.destroyed = false;
      this.defaultEncoding = options.defaultEncoding || "utf8";
      this.awaitDrain = 0;
      this.readingMore = false;
      this.decoder = null;
      this.encoding = null;
      if (options.encoding) {
        if (!StringDecoder) StringDecoder = require_string_decoder().StringDecoder;
        this.decoder = new StringDecoder(options.encoding);
        this.encoding = options.encoding;
      }
    }
    __name(ReadableState, "ReadableState");
    function Readable(options) {
      Duplex = Duplex || require_stream_duplex2();
      if (!(this instanceof Readable)) return new Readable(options);
      var isDuplex = this instanceof Duplex;
      this._readableState = new ReadableState(options, this, isDuplex);
      this.readable = true;
      if (options) {
        if (typeof options.read === "function") this._read = options.read;
        if (typeof options.destroy === "function") this._destroy = options.destroy;
      }
      Stream.call(this);
    }
    __name(Readable, "Readable");
    Object.defineProperty(Readable.prototype, "destroyed", {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: /* @__PURE__ */ __name(function get() {
        if (this._readableState === void 0) {
          return false;
        }
        return this._readableState.destroyed;
      }, "get"),
      set: /* @__PURE__ */ __name(function set(value) {
        if (!this._readableState) {
          return;
        }
        this._readableState.destroyed = value;
      }, "set")
    });
    Readable.prototype.destroy = destroyImpl.destroy;
    Readable.prototype._undestroy = destroyImpl.undestroy;
    Readable.prototype._destroy = function(err, cb) {
      cb(err);
    };
    Readable.prototype.push = function(chunk, encoding) {
      var state2 = this._readableState;
      var skipChunkCheck;
      if (!state2.objectMode) {
        if (typeof chunk === "string") {
          encoding = encoding || state2.defaultEncoding;
          if (encoding !== state2.encoding) {
            chunk = Buffer2.from(chunk, encoding);
            encoding = "";
          }
          skipChunkCheck = true;
        }
      } else {
        skipChunkCheck = true;
      }
      return readableAddChunk(this, chunk, encoding, false, skipChunkCheck);
    };
    Readable.prototype.unshift = function(chunk) {
      return readableAddChunk(this, chunk, null, true, false);
    };
    function readableAddChunk(stream, chunk, encoding, addToFront, skipChunkCheck) {
      debug("readableAddChunk", chunk);
      var state2 = stream._readableState;
      if (chunk === null) {
        state2.reading = false;
        onEofChunk(stream, state2);
      } else {
        var er;
        if (!skipChunkCheck) er = chunkInvalid(state2, chunk);
        if (er) {
          errorOrDestroy(stream, er);
        } else if (state2.objectMode || chunk && chunk.length > 0) {
          if (typeof chunk !== "string" && !state2.objectMode && Object.getPrototypeOf(chunk) !== Buffer2.prototype) {
            chunk = _uint8ArrayToBuffer(chunk);
          }
          if (addToFront) {
            if (state2.endEmitted) errorOrDestroy(stream, new ERR_STREAM_UNSHIFT_AFTER_END_EVENT());
            else addChunk(stream, state2, chunk, true);
          } else if (state2.ended) {
            errorOrDestroy(stream, new ERR_STREAM_PUSH_AFTER_EOF());
          } else if (state2.destroyed) {
            return false;
          } else {
            state2.reading = false;
            if (state2.decoder && !encoding) {
              chunk = state2.decoder.write(chunk);
              if (state2.objectMode || chunk.length !== 0) addChunk(stream, state2, chunk, false);
              else maybeReadMore(stream, state2);
            } else {
              addChunk(stream, state2, chunk, false);
            }
          }
        } else if (!addToFront) {
          state2.reading = false;
          maybeReadMore(stream, state2);
        }
      }
      return !state2.ended && (state2.length < state2.highWaterMark || state2.length === 0);
    }
    __name(readableAddChunk, "readableAddChunk");
    function addChunk(stream, state2, chunk, addToFront) {
      if (state2.flowing && state2.length === 0 && !state2.sync) {
        state2.awaitDrain = 0;
        stream.emit("data", chunk);
      } else {
        state2.length += state2.objectMode ? 1 : chunk.length;
        if (addToFront) state2.buffer.unshift(chunk);
        else state2.buffer.push(chunk);
        if (state2.needReadable) emitReadable(stream);
      }
      maybeReadMore(stream, state2);
    }
    __name(addChunk, "addChunk");
    function chunkInvalid(state2, chunk) {
      var er;
      if (!_isUint8Array(chunk) && typeof chunk !== "string" && chunk !== void 0 && !state2.objectMode) {
        er = new ERR_INVALID_ARG_TYPE("chunk", ["string", "Buffer", "Uint8Array"], chunk);
      }
      return er;
    }
    __name(chunkInvalid, "chunkInvalid");
    Readable.prototype.isPaused = function() {
      return this._readableState.flowing === false;
    };
    Readable.prototype.setEncoding = function(enc) {
      if (!StringDecoder) StringDecoder = require_string_decoder().StringDecoder;
      var decoder = new StringDecoder(enc);
      this._readableState.decoder = decoder;
      this._readableState.encoding = this._readableState.decoder.encoding;
      var p = this._readableState.buffer.head;
      var content = "";
      while (p !== null) {
        content += decoder.write(p.data);
        p = p.next;
      }
      this._readableState.buffer.clear();
      if (content !== "") this._readableState.buffer.push(content);
      this._readableState.length = content.length;
      return this;
    };
    var MAX_HWM = 1073741824;
    function computeNewHighWaterMark(n) {
      if (n >= MAX_HWM) {
        n = MAX_HWM;
      } else {
        n--;
        n |= n >>> 1;
        n |= n >>> 2;
        n |= n >>> 4;
        n |= n >>> 8;
        n |= n >>> 16;
        n++;
      }
      return n;
    }
    __name(computeNewHighWaterMark, "computeNewHighWaterMark");
    function howMuchToRead(n, state2) {
      if (n <= 0 || state2.length === 0 && state2.ended) return 0;
      if (state2.objectMode) return 1;
      if (n !== n) {
        if (state2.flowing && state2.length) return state2.buffer.head.data.length;
        else return state2.length;
      }
      if (n > state2.highWaterMark) state2.highWaterMark = computeNewHighWaterMark(n);
      if (n <= state2.length) return n;
      if (!state2.ended) {
        state2.needReadable = true;
        return 0;
      }
      return state2.length;
    }
    __name(howMuchToRead, "howMuchToRead");
    Readable.prototype.read = function(n) {
      debug("read", n);
      n = parseInt(n, 10);
      var state2 = this._readableState;
      var nOrig = n;
      if (n !== 0) state2.emittedReadable = false;
      if (n === 0 && state2.needReadable && ((state2.highWaterMark !== 0 ? state2.length >= state2.highWaterMark : state2.length > 0) || state2.ended)) {
        debug("read: emitReadable", state2.length, state2.ended);
        if (state2.length === 0 && state2.ended) endReadable(this);
        else emitReadable(this);
        return null;
      }
      n = howMuchToRead(n, state2);
      if (n === 0 && state2.ended) {
        if (state2.length === 0) endReadable(this);
        return null;
      }
      var doRead = state2.needReadable;
      debug("need readable", doRead);
      if (state2.length === 0 || state2.length - n < state2.highWaterMark) {
        doRead = true;
        debug("length less than watermark", doRead);
      }
      if (state2.ended || state2.reading) {
        doRead = false;
        debug("reading or ended", doRead);
      } else if (doRead) {
        debug("do read");
        state2.reading = true;
        state2.sync = true;
        if (state2.length === 0) state2.needReadable = true;
        this._read(state2.highWaterMark);
        state2.sync = false;
        if (!state2.reading) n = howMuchToRead(nOrig, state2);
      }
      var ret;
      if (n > 0) ret = fromList(n, state2);
      else ret = null;
      if (ret === null) {
        state2.needReadable = state2.length <= state2.highWaterMark;
        n = 0;
      } else {
        state2.length -= n;
        state2.awaitDrain = 0;
      }
      if (state2.length === 0) {
        if (!state2.ended) state2.needReadable = true;
        if (nOrig !== n && state2.ended) endReadable(this);
      }
      if (ret !== null) this.emit("data", ret);
      return ret;
    };
    function onEofChunk(stream, state2) {
      debug("onEofChunk");
      if (state2.ended) return;
      if (state2.decoder) {
        var chunk = state2.decoder.end();
        if (chunk && chunk.length) {
          state2.buffer.push(chunk);
          state2.length += state2.objectMode ? 1 : chunk.length;
        }
      }
      state2.ended = true;
      if (state2.sync) {
        emitReadable(stream);
      } else {
        state2.needReadable = false;
        if (!state2.emittedReadable) {
          state2.emittedReadable = true;
          emitReadable_(stream);
        }
      }
    }
    __name(onEofChunk, "onEofChunk");
    function emitReadable(stream) {
      var state2 = stream._readableState;
      debug("emitReadable", state2.needReadable, state2.emittedReadable);
      state2.needReadable = false;
      if (!state2.emittedReadable) {
        debug("emitReadable", state2.flowing);
        state2.emittedReadable = true;
        process.nextTick(emitReadable_, stream);
      }
    }
    __name(emitReadable, "emitReadable");
    function emitReadable_(stream) {
      var state2 = stream._readableState;
      debug("emitReadable_", state2.destroyed, state2.length, state2.ended);
      if (!state2.destroyed && (state2.length || state2.ended)) {
        stream.emit("readable");
        state2.emittedReadable = false;
      }
      state2.needReadable = !state2.flowing && !state2.ended && state2.length <= state2.highWaterMark;
      flow(stream);
    }
    __name(emitReadable_, "emitReadable_");
    function maybeReadMore(stream, state2) {
      if (!state2.readingMore) {
        state2.readingMore = true;
        process.nextTick(maybeReadMore_, stream, state2);
      }
    }
    __name(maybeReadMore, "maybeReadMore");
    function maybeReadMore_(stream, state2) {
      while (!state2.reading && !state2.ended && (state2.length < state2.highWaterMark || state2.flowing && state2.length === 0)) {
        var len = state2.length;
        debug("maybeReadMore read 0");
        stream.read(0);
        if (len === state2.length)
          break;
      }
      state2.readingMore = false;
    }
    __name(maybeReadMore_, "maybeReadMore_");
    Readable.prototype._read = function(n) {
      errorOrDestroy(this, new ERR_METHOD_NOT_IMPLEMENTED("_read()"));
    };
    Readable.prototype.pipe = function(dest, pipeOpts) {
      var src = this;
      var state2 = this._readableState;
      switch (state2.pipesCount) {
        case 0:
          state2.pipes = dest;
          break;
        case 1:
          state2.pipes = [state2.pipes, dest];
          break;
        default:
          state2.pipes.push(dest);
          break;
      }
      state2.pipesCount += 1;
      debug("pipe count=%d opts=%j", state2.pipesCount, pipeOpts);
      var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;
      var endFn = doEnd ? onend : unpipe;
      if (state2.endEmitted) process.nextTick(endFn);
      else src.once("end", endFn);
      dest.on("unpipe", onunpipe);
      function onunpipe(readable, unpipeInfo) {
        debug("onunpipe");
        if (readable === src) {
          if (unpipeInfo && unpipeInfo.hasUnpiped === false) {
            unpipeInfo.hasUnpiped = true;
            cleanup();
          }
        }
      }
      __name(onunpipe, "onunpipe");
      function onend() {
        debug("onend");
        dest.end();
      }
      __name(onend, "onend");
      var ondrain = pipeOnDrain(src);
      dest.on("drain", ondrain);
      var cleanedUp = false;
      function cleanup() {
        debug("cleanup");
        dest.removeListener("close", onclose);
        dest.removeListener("finish", onfinish);
        dest.removeListener("drain", ondrain);
        dest.removeListener("error", onerror);
        dest.removeListener("unpipe", onunpipe);
        src.removeListener("end", onend);
        src.removeListener("end", unpipe);
        src.removeListener("data", ondata);
        cleanedUp = true;
        if (state2.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
      }
      __name(cleanup, "cleanup");
      src.on("data", ondata);
      function ondata(chunk) {
        debug("ondata");
        var ret = dest.write(chunk);
        debug("dest.write", ret);
        if (ret === false) {
          if ((state2.pipesCount === 1 && state2.pipes === dest || state2.pipesCount > 1 && indexOf(state2.pipes, dest) !== -1) && !cleanedUp) {
            debug("false write response, pause", state2.awaitDrain);
            state2.awaitDrain++;
          }
          src.pause();
        }
      }
      __name(ondata, "ondata");
      function onerror(er) {
        debug("onerror", er);
        unpipe();
        dest.removeListener("error", onerror);
        if (EElistenerCount(dest, "error") === 0) errorOrDestroy(dest, er);
      }
      __name(onerror, "onerror");
      prependListener(dest, "error", onerror);
      function onclose() {
        dest.removeListener("finish", onfinish);
        unpipe();
      }
      __name(onclose, "onclose");
      dest.once("close", onclose);
      function onfinish() {
        debug("onfinish");
        dest.removeListener("close", onclose);
        unpipe();
      }
      __name(onfinish, "onfinish");
      dest.once("finish", onfinish);
      function unpipe() {
        debug("unpipe");
        src.unpipe(dest);
      }
      __name(unpipe, "unpipe");
      dest.emit("pipe", src);
      if (!state2.flowing) {
        debug("pipe resume");
        src.resume();
      }
      return dest;
    };
    function pipeOnDrain(src) {
      return /* @__PURE__ */ __name(function pipeOnDrainFunctionResult() {
        var state2 = src._readableState;
        debug("pipeOnDrain", state2.awaitDrain);
        if (state2.awaitDrain) state2.awaitDrain--;
        if (state2.awaitDrain === 0 && EElistenerCount(src, "data")) {
          state2.flowing = true;
          flow(src);
        }
      }, "pipeOnDrainFunctionResult");
    }
    __name(pipeOnDrain, "pipeOnDrain");
    Readable.prototype.unpipe = function(dest) {
      var state2 = this._readableState;
      var unpipeInfo = {
        hasUnpiped: false
      };
      if (state2.pipesCount === 0) return this;
      if (state2.pipesCount === 1) {
        if (dest && dest !== state2.pipes) return this;
        if (!dest) dest = state2.pipes;
        state2.pipes = null;
        state2.pipesCount = 0;
        state2.flowing = false;
        if (dest) dest.emit("unpipe", this, unpipeInfo);
        return this;
      }
      if (!dest) {
        var dests = state2.pipes;
        var len = state2.pipesCount;
        state2.pipes = null;
        state2.pipesCount = 0;
        state2.flowing = false;
        for (var i = 0; i < len; i++) dests[i].emit("unpipe", this, {
          hasUnpiped: false
        });
        return this;
      }
      var index = indexOf(state2.pipes, dest);
      if (index === -1) return this;
      state2.pipes.splice(index, 1);
      state2.pipesCount -= 1;
      if (state2.pipesCount === 1) state2.pipes = state2.pipes[0];
      dest.emit("unpipe", this, unpipeInfo);
      return this;
    };
    Readable.prototype.on = function(ev, fn) {
      var res = Stream.prototype.on.call(this, ev, fn);
      var state2 = this._readableState;
      if (ev === "data") {
        state2.readableListening = this.listenerCount("readable") > 0;
        if (state2.flowing !== false) this.resume();
      } else if (ev === "readable") {
        if (!state2.endEmitted && !state2.readableListening) {
          state2.readableListening = state2.needReadable = true;
          state2.flowing = false;
          state2.emittedReadable = false;
          debug("on readable", state2.length, state2.reading);
          if (state2.length) {
            emitReadable(this);
          } else if (!state2.reading) {
            process.nextTick(nReadingNextTick, this);
          }
        }
      }
      return res;
    };
    Readable.prototype.addListener = Readable.prototype.on;
    Readable.prototype.removeListener = function(ev, fn) {
      var res = Stream.prototype.removeListener.call(this, ev, fn);
      if (ev === "readable") {
        process.nextTick(updateReadableListening, this);
      }
      return res;
    };
    Readable.prototype.removeAllListeners = function(ev) {
      var res = Stream.prototype.removeAllListeners.apply(this, arguments);
      if (ev === "readable" || ev === void 0) {
        process.nextTick(updateReadableListening, this);
      }
      return res;
    };
    function updateReadableListening(self2) {
      var state2 = self2._readableState;
      state2.readableListening = self2.listenerCount("readable") > 0;
      if (state2.resumeScheduled && !state2.paused) {
        state2.flowing = true;
      } else if (self2.listenerCount("data") > 0) {
        self2.resume();
      }
    }
    __name(updateReadableListening, "updateReadableListening");
    function nReadingNextTick(self2) {
      debug("readable nexttick read 0");
      self2.read(0);
    }
    __name(nReadingNextTick, "nReadingNextTick");
    Readable.prototype.resume = function() {
      var state2 = this._readableState;
      if (!state2.flowing) {
        debug("resume");
        state2.flowing = !state2.readableListening;
        resume(this, state2);
      }
      state2.paused = false;
      return this;
    };
    function resume(stream, state2) {
      if (!state2.resumeScheduled) {
        state2.resumeScheduled = true;
        process.nextTick(resume_, stream, state2);
      }
    }
    __name(resume, "resume");
    function resume_(stream, state2) {
      debug("resume", state2.reading);
      if (!state2.reading) {
        stream.read(0);
      }
      state2.resumeScheduled = false;
      stream.emit("resume");
      flow(stream);
      if (state2.flowing && !state2.reading) stream.read(0);
    }
    __name(resume_, "resume_");
    Readable.prototype.pause = function() {
      debug("call pause flowing=%j", this._readableState.flowing);
      if (this._readableState.flowing !== false) {
        debug("pause");
        this._readableState.flowing = false;
        this.emit("pause");
      }
      this._readableState.paused = true;
      return this;
    };
    function flow(stream) {
      var state2 = stream._readableState;
      debug("flow", state2.flowing);
      while (state2.flowing && stream.read() !== null) ;
    }
    __name(flow, "flow");
    Readable.prototype.wrap = function(stream) {
      var _this = this;
      var state2 = this._readableState;
      var paused = false;
      stream.on("end", function() {
        debug("wrapped end");
        if (state2.decoder && !state2.ended) {
          var chunk = state2.decoder.end();
          if (chunk && chunk.length) _this.push(chunk);
        }
        _this.push(null);
      });
      stream.on("data", function(chunk) {
        debug("wrapped data");
        if (state2.decoder) chunk = state2.decoder.write(chunk);
        if (state2.objectMode && (chunk === null || chunk === void 0)) return;
        else if (!state2.objectMode && (!chunk || !chunk.length)) return;
        var ret = _this.push(chunk);
        if (!ret) {
          paused = true;
          stream.pause();
        }
      });
      for (var i in stream) {
        if (this[i] === void 0 && typeof stream[i] === "function") {
          this[i] = (/* @__PURE__ */ __name(function methodWrap(method) {
            return /* @__PURE__ */ __name(function methodWrapReturnFunction() {
              return stream[method].apply(stream, arguments);
            }, "methodWrapReturnFunction");
          }, "methodWrap"))(i);
        }
      }
      for (var n = 0; n < kProxyEvents.length; n++) {
        stream.on(kProxyEvents[n], this.emit.bind(this, kProxyEvents[n]));
      }
      this._read = function(n2) {
        debug("wrapped _read", n2);
        if (paused) {
          paused = false;
          stream.resume();
        }
      };
      return this;
    };
    if (typeof Symbol === "function") {
      Readable.prototype[Symbol.asyncIterator] = function() {
        if (createReadableStreamAsyncIterator === void 0) {
          createReadableStreamAsyncIterator = require_async_iterator2();
        }
        return createReadableStreamAsyncIterator(this);
      };
    }
    Object.defineProperty(Readable.prototype, "readableHighWaterMark", {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: /* @__PURE__ */ __name(function get() {
        return this._readableState.highWaterMark;
      }, "get")
    });
    Object.defineProperty(Readable.prototype, "readableBuffer", {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: /* @__PURE__ */ __name(function get() {
        return this._readableState && this._readableState.buffer;
      }, "get")
    });
    Object.defineProperty(Readable.prototype, "readableFlowing", {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: /* @__PURE__ */ __name(function get() {
        return this._readableState.flowing;
      }, "get"),
      set: /* @__PURE__ */ __name(function set(state2) {
        if (this._readableState) {
          this._readableState.flowing = state2;
        }
      }, "set")
    });
    Readable._fromList = fromList;
    Object.defineProperty(Readable.prototype, "readableLength", {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: /* @__PURE__ */ __name(function get() {
        return this._readableState.length;
      }, "get")
    });
    function fromList(n, state2) {
      if (state2.length === 0) return null;
      var ret;
      if (state2.objectMode) ret = state2.buffer.shift();
      else if (!n || n >= state2.length) {
        if (state2.decoder) ret = state2.buffer.join("");
        else if (state2.buffer.length === 1) ret = state2.buffer.first();
        else ret = state2.buffer.concat(state2.length);
        state2.buffer.clear();
      } else {
        ret = state2.buffer.consume(n, state2.decoder);
      }
      return ret;
    }
    __name(fromList, "fromList");
    function endReadable(stream) {
      var state2 = stream._readableState;
      debug("endReadable", state2.endEmitted);
      if (!state2.endEmitted) {
        state2.ended = true;
        process.nextTick(endReadableNT, state2, stream);
      }
    }
    __name(endReadable, "endReadable");
    function endReadableNT(state2, stream) {
      debug("endReadableNT", state2.endEmitted, state2.length);
      if (!state2.endEmitted && state2.length === 0) {
        state2.endEmitted = true;
        stream.readable = false;
        stream.emit("end");
        if (state2.autoDestroy) {
          var wState = stream._writableState;
          if (!wState || wState.autoDestroy && wState.finished) {
            stream.destroy();
          }
        }
      }
    }
    __name(endReadableNT, "endReadableNT");
    if (typeof Symbol === "function") {
      Readable.from = function(iterable, opts) {
        if (from === void 0) {
          from = require_from2();
        }
        return from(Readable, iterable, opts);
      };
    }
    function indexOf(xs, x) {
      for (var i = 0, l = xs.length; i < l; i++) {
        if (xs[i] === x) return i;
      }
      return -1;
    }
    __name(indexOf, "indexOf");
  }
});

// node_modules/winston/node_modules/readable-stream/lib/_stream_transform.js
var require_stream_transform = __commonJS({
  "node_modules/winston/node_modules/readable-stream/lib/_stream_transform.js"(exports2, module2) {
    "use strict";
    module2.exports = Transform;
    var _require$codes = require_errors3().codes;
    var ERR_METHOD_NOT_IMPLEMENTED = _require$codes.ERR_METHOD_NOT_IMPLEMENTED;
    var ERR_MULTIPLE_CALLBACK = _require$codes.ERR_MULTIPLE_CALLBACK;
    var ERR_TRANSFORM_ALREADY_TRANSFORMING = _require$codes.ERR_TRANSFORM_ALREADY_TRANSFORMING;
    var ERR_TRANSFORM_WITH_LENGTH_0 = _require$codes.ERR_TRANSFORM_WITH_LENGTH_0;
    var Duplex = require_stream_duplex2();
    require_inherits()(Transform, Duplex);
    function afterTransform(er, data) {
      var ts = this._transformState;
      ts.transforming = false;
      var cb = ts.writecb;
      if (cb === null) {
        return this.emit("error", new ERR_MULTIPLE_CALLBACK());
      }
      ts.writechunk = null;
      ts.writecb = null;
      if (data != null)
        this.push(data);
      cb(er);
      var rs = this._readableState;
      rs.reading = false;
      if (rs.needReadable || rs.length < rs.highWaterMark) {
        this._read(rs.highWaterMark);
      }
    }
    __name(afterTransform, "afterTransform");
    function Transform(options) {
      if (!(this instanceof Transform)) return new Transform(options);
      Duplex.call(this, options);
      this._transformState = {
        afterTransform: afterTransform.bind(this),
        needTransform: false,
        transforming: false,
        writecb: null,
        writechunk: null,
        writeencoding: null
      };
      this._readableState.needReadable = true;
      this._readableState.sync = false;
      if (options) {
        if (typeof options.transform === "function") this._transform = options.transform;
        if (typeof options.flush === "function") this._flush = options.flush;
      }
      this.on("prefinish", prefinish);
    }
    __name(Transform, "Transform");
    function prefinish() {
      var _this = this;
      if (typeof this._flush === "function" && !this._readableState.destroyed) {
        this._flush(function(er, data) {
          done(_this, er, data);
        });
      } else {
        done(this, null, null);
      }
    }
    __name(prefinish, "prefinish");
    Transform.prototype.push = function(chunk, encoding) {
      this._transformState.needTransform = false;
      return Duplex.prototype.push.call(this, chunk, encoding);
    };
    Transform.prototype._transform = function(chunk, encoding, cb) {
      cb(new ERR_METHOD_NOT_IMPLEMENTED("_transform()"));
    };
    Transform.prototype._write = function(chunk, encoding, cb) {
      var ts = this._transformState;
      ts.writecb = cb;
      ts.writechunk = chunk;
      ts.writeencoding = encoding;
      if (!ts.transforming) {
        var rs = this._readableState;
        if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
      }
    };
    Transform.prototype._read = function(n) {
      var ts = this._transformState;
      if (ts.writechunk !== null && !ts.transforming) {
        ts.transforming = true;
        this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
      } else {
        ts.needTransform = true;
      }
    };
    Transform.prototype._destroy = function(err, cb) {
      Duplex.prototype._destroy.call(this, err, function(err2) {
        cb(err2);
      });
    };
    function done(stream, er, data) {
      if (er) return stream.emit("error", er);
      if (data != null)
        stream.push(data);
      if (stream._writableState.length) throw new ERR_TRANSFORM_WITH_LENGTH_0();
      if (stream._transformState.transforming) throw new ERR_TRANSFORM_ALREADY_TRANSFORMING();
      return stream.push(null);
    }
    __name(done, "done");
  }
});

// node_modules/winston/node_modules/readable-stream/lib/_stream_passthrough.js
var require_stream_passthrough = __commonJS({
  "node_modules/winston/node_modules/readable-stream/lib/_stream_passthrough.js"(exports2, module2) {
    "use strict";
    module2.exports = PassThrough;
    var Transform = require_stream_transform();
    require_inherits()(PassThrough, Transform);
    function PassThrough(options) {
      if (!(this instanceof PassThrough)) return new PassThrough(options);
      Transform.call(this, options);
    }
    __name(PassThrough, "PassThrough");
    PassThrough.prototype._transform = function(chunk, encoding, cb) {
      cb(null, chunk);
    };
  }
});

// node_modules/winston/node_modules/readable-stream/lib/internal/streams/pipeline.js
var require_pipeline = __commonJS({
  "node_modules/winston/node_modules/readable-stream/lib/internal/streams/pipeline.js"(exports2, module2) {
    "use strict";
    var eos;
    function once(callback) {
      var called = false;
      return function() {
        if (called) return;
        called = true;
        callback.apply(void 0, arguments);
      };
    }
    __name(once, "once");
    var _require$codes = require_errors3().codes;
    var ERR_MISSING_ARGS = _require$codes.ERR_MISSING_ARGS;
    var ERR_STREAM_DESTROYED = _require$codes.ERR_STREAM_DESTROYED;
    function noop(err) {
      if (err) throw err;
    }
    __name(noop, "noop");
    function isRequest(stream) {
      return stream.setHeader && typeof stream.abort === "function";
    }
    __name(isRequest, "isRequest");
    function destroyer(stream, reading, writing, callback) {
      callback = once(callback);
      var closed = false;
      stream.on("close", function() {
        closed = true;
      });
      if (eos === void 0) eos = require_end_of_stream2();
      eos(stream, {
        readable: reading,
        writable: writing
      }, function(err) {
        if (err) return callback(err);
        closed = true;
        callback();
      });
      var destroyed = false;
      return function(err) {
        if (closed) return;
        if (destroyed) return;
        destroyed = true;
        if (isRequest(stream)) return stream.abort();
        if (typeof stream.destroy === "function") return stream.destroy();
        callback(err || new ERR_STREAM_DESTROYED("pipe"));
      };
    }
    __name(destroyer, "destroyer");
    function call(fn) {
      fn();
    }
    __name(call, "call");
    function pipe(from, to) {
      return from.pipe(to);
    }
    __name(pipe, "pipe");
    function popCallback(streams) {
      if (!streams.length) return noop;
      if (typeof streams[streams.length - 1] !== "function") return noop;
      return streams.pop();
    }
    __name(popCallback, "popCallback");
    function pipeline() {
      for (var _len = arguments.length, streams = new Array(_len), _key = 0; _key < _len; _key++) {
        streams[_key] = arguments[_key];
      }
      var callback = popCallback(streams);
      if (Array.isArray(streams[0])) streams = streams[0];
      if (streams.length < 2) {
        throw new ERR_MISSING_ARGS("streams");
      }
      var error;
      var destroys = streams.map(function(stream, i) {
        var reading = i < streams.length - 1;
        var writing = i > 0;
        return destroyer(stream, reading, writing, function(err) {
          if (!error) error = err;
          if (err) destroys.forEach(call);
          if (reading) return;
          destroys.forEach(call);
          callback(error);
        });
      });
      return streams.reduce(pipe);
    }
    __name(pipeline, "pipeline");
    module2.exports = pipeline;
  }
});

// node_modules/winston/node_modules/readable-stream/readable.js
var require_readable = __commonJS({
  "node_modules/winston/node_modules/readable-stream/readable.js"(exports2, module2) {
    var Stream = require("stream");
    if (process.env.READABLE_STREAM === "disable" && Stream) {
      module2.exports = Stream.Readable;
      Object.assign(module2.exports, Stream);
      module2.exports.Stream = Stream;
    } else {
      exports2 = module2.exports = require_stream_readable2();
      exports2.Stream = Stream || exports2;
      exports2.Readable = exports2;
      exports2.Writable = require_stream_writable2();
      exports2.Duplex = require_stream_duplex2();
      exports2.Transform = require_stream_transform();
      exports2.PassThrough = require_stream_passthrough();
      exports2.finished = require_end_of_stream2();
      exports2.pipeline = require_pipeline();
    }
  }
});

// node_modules/@dabh/diagnostics/diagnostics.js
var require_diagnostics = __commonJS({
  "node_modules/@dabh/diagnostics/diagnostics.js"(exports2, module2) {
    var adapters = [];
    var modifiers = [];
    var logger = /* @__PURE__ */ __name(function devnull() {
    }, "devnull");
    function use(adapter) {
      if (~adapters.indexOf(adapter)) return false;
      adapters.push(adapter);
      return true;
    }
    __name(use, "use");
    function set(custom) {
      logger = custom;
    }
    __name(set, "set");
    function enabled(namespace) {
      var async = [];
      for (var i = 0; i < adapters.length; i++) {
        if (adapters[i].async) {
          async.push(adapters[i]);
          continue;
        }
        if (adapters[i](namespace)) return true;
      }
      if (!async.length) return false;
      return new Promise(/* @__PURE__ */ __name(function pinky(resolve) {
        Promise.all(
          async.map(/* @__PURE__ */ __name(function prebind(fn) {
            return fn(namespace);
          }, "prebind"))
        ).then(/* @__PURE__ */ __name(function resolved(values) {
          resolve(values.some(Boolean));
        }, "resolved"));
      }, "pinky"));
    }
    __name(enabled, "enabled");
    function modify(fn) {
      if (~modifiers.indexOf(fn)) return false;
      modifiers.push(fn);
      return true;
    }
    __name(modify, "modify");
    function write() {
      logger.apply(logger, arguments);
    }
    __name(write, "write");
    function process2(message) {
      for (var i = 0; i < modifiers.length; i++) {
        message = modifiers[i].apply(modifiers[i], arguments);
      }
      return message;
    }
    __name(process2, "process");
    function introduce(fn, options) {
      var has = Object.prototype.hasOwnProperty;
      for (var key in options) {
        if (has.call(options, key)) {
          fn[key] = options[key];
        }
      }
      return fn;
    }
    __name(introduce, "introduce");
    function nope(options) {
      options.enabled = false;
      options.modify = modify;
      options.set = set;
      options.use = use;
      return introduce(/* @__PURE__ */ __name(function diagnopes() {
        return false;
      }, "diagnopes"), options);
    }
    __name(nope, "nope");
    function yep(options) {
      function diagnostics() {
        var args = Array.prototype.slice.call(arguments, 0);
        write.call(write, options, process2(args, options));
        return true;
      }
      __name(diagnostics, "diagnostics");
      options.enabled = true;
      options.modify = modify;
      options.set = set;
      options.use = use;
      return introduce(diagnostics, options);
    }
    __name(yep, "yep");
    module2.exports = /* @__PURE__ */ __name(function create(diagnostics) {
      diagnostics.introduce = introduce;
      diagnostics.enabled = enabled;
      diagnostics.process = process2;
      diagnostics.modify = modify;
      diagnostics.write = write;
      diagnostics.nope = nope;
      diagnostics.yep = yep;
      diagnostics.set = set;
      diagnostics.use = use;
      return diagnostics;
    }, "create");
  }
});

// node_modules/@dabh/diagnostics/node/production.js
var require_production = __commonJS({
  "node_modules/@dabh/diagnostics/node/production.js"(exports2, module2) {
    var create = require_diagnostics();
    var diagnostics = create(/* @__PURE__ */ __name(function prod(namespace, options) {
      options = options || {};
      options.namespace = namespace;
      options.prod = true;
      options.dev = false;
      if (!(options.force || prod.force)) return prod.nope(options);
      return prod.yep(options);
    }, "prod"));
    module2.exports = diagnostics;
  }
});

// node_modules/@so-ric/colorspace/dist/index.cjs.js
var require_index_cjs = __commonJS({
  "node_modules/@so-ric/colorspace/dist/index.cjs.js"(exports2, module2) {
    "use strict";
    var cssKeywords = {
      aliceblue: [240, 248, 255],
      antiquewhite: [250, 235, 215],
      aqua: [0, 255, 255],
      aquamarine: [127, 255, 212],
      azure: [240, 255, 255],
      beige: [245, 245, 220],
      bisque: [255, 228, 196],
      black: [0, 0, 0],
      blanchedalmond: [255, 235, 205],
      blue: [0, 0, 255],
      blueviolet: [138, 43, 226],
      brown: [165, 42, 42],
      burlywood: [222, 184, 135],
      cadetblue: [95, 158, 160],
      chartreuse: [127, 255, 0],
      chocolate: [210, 105, 30],
      coral: [255, 127, 80],
      cornflowerblue: [100, 149, 237],
      cornsilk: [255, 248, 220],
      crimson: [220, 20, 60],
      cyan: [0, 255, 255],
      darkblue: [0, 0, 139],
      darkcyan: [0, 139, 139],
      darkgoldenrod: [184, 134, 11],
      darkgray: [169, 169, 169],
      darkgreen: [0, 100, 0],
      darkgrey: [169, 169, 169],
      darkkhaki: [189, 183, 107],
      darkmagenta: [139, 0, 139],
      darkolivegreen: [85, 107, 47],
      darkorange: [255, 140, 0],
      darkorchid: [153, 50, 204],
      darkred: [139, 0, 0],
      darksalmon: [233, 150, 122],
      darkseagreen: [143, 188, 143],
      darkslateblue: [72, 61, 139],
      darkslategray: [47, 79, 79],
      darkslategrey: [47, 79, 79],
      darkturquoise: [0, 206, 209],
      darkviolet: [148, 0, 211],
      deeppink: [255, 20, 147],
      deepskyblue: [0, 191, 255],
      dimgray: [105, 105, 105],
      dimgrey: [105, 105, 105],
      dodgerblue: [30, 144, 255],
      firebrick: [178, 34, 34],
      floralwhite: [255, 250, 240],
      forestgreen: [34, 139, 34],
      fuchsia: [255, 0, 255],
      gainsboro: [220, 220, 220],
      ghostwhite: [248, 248, 255],
      gold: [255, 215, 0],
      goldenrod: [218, 165, 32],
      gray: [128, 128, 128],
      green: [0, 128, 0],
      greenyellow: [173, 255, 47],
      grey: [128, 128, 128],
      honeydew: [240, 255, 240],
      hotpink: [255, 105, 180],
      indianred: [205, 92, 92],
      indigo: [75, 0, 130],
      ivory: [255, 255, 240],
      khaki: [240, 230, 140],
      lavender: [230, 230, 250],
      lavenderblush: [255, 240, 245],
      lawngreen: [124, 252, 0],
      lemonchiffon: [255, 250, 205],
      lightblue: [173, 216, 230],
      lightcoral: [240, 128, 128],
      lightcyan: [224, 255, 255],
      lightgoldenrodyellow: [250, 250, 210],
      lightgray: [211, 211, 211],
      lightgreen: [144, 238, 144],
      lightgrey: [211, 211, 211],
      lightpink: [255, 182, 193],
      lightsalmon: [255, 160, 122],
      lightseagreen: [32, 178, 170],
      lightskyblue: [135, 206, 250],
      lightslategray: [119, 136, 153],
      lightslategrey: [119, 136, 153],
      lightsteelblue: [176, 196, 222],
      lightyellow: [255, 255, 224],
      lime: [0, 255, 0],
      limegreen: [50, 205, 50],
      linen: [250, 240, 230],
      magenta: [255, 0, 255],
      maroon: [128, 0, 0],
      mediumaquamarine: [102, 205, 170],
      mediumblue: [0, 0, 205],
      mediumorchid: [186, 85, 211],
      mediumpurple: [147, 112, 219],
      mediumseagreen: [60, 179, 113],
      mediumslateblue: [123, 104, 238],
      mediumspringgreen: [0, 250, 154],
      mediumturquoise: [72, 209, 204],
      mediumvioletred: [199, 21, 133],
      midnightblue: [25, 25, 112],
      mintcream: [245, 255, 250],
      mistyrose: [255, 228, 225],
      moccasin: [255, 228, 181],
      navajowhite: [255, 222, 173],
      navy: [0, 0, 128],
      oldlace: [253, 245, 230],
      olive: [128, 128, 0],
      olivedrab: [107, 142, 35],
      orange: [255, 165, 0],
      orangered: [255, 69, 0],
      orchid: [218, 112, 214],
      palegoldenrod: [238, 232, 170],
      palegreen: [152, 251, 152],
      paleturquoise: [175, 238, 238],
      palevioletred: [219, 112, 147],
      papayawhip: [255, 239, 213],
      peachpuff: [255, 218, 185],
      peru: [205, 133, 63],
      pink: [255, 192, 203],
      plum: [221, 160, 221],
      powderblue: [176, 224, 230],
      purple: [128, 0, 128],
      rebeccapurple: [102, 51, 153],
      red: [255, 0, 0],
      rosybrown: [188, 143, 143],
      royalblue: [65, 105, 225],
      saddlebrown: [139, 69, 19],
      salmon: [250, 128, 114],
      sandybrown: [244, 164, 96],
      seagreen: [46, 139, 87],
      seashell: [255, 245, 238],
      sienna: [160, 82, 45],
      silver: [192, 192, 192],
      skyblue: [135, 206, 235],
      slateblue: [106, 90, 205],
      slategray: [112, 128, 144],
      slategrey: [112, 128, 144],
      snow: [255, 250, 250],
      springgreen: [0, 255, 127],
      steelblue: [70, 130, 180],
      tan: [210, 180, 140],
      teal: [0, 128, 128],
      thistle: [216, 191, 216],
      tomato: [255, 99, 71],
      turquoise: [64, 224, 208],
      violet: [238, 130, 238],
      wheat: [245, 222, 179],
      white: [255, 255, 255],
      whitesmoke: [245, 245, 245],
      yellow: [255, 255, 0],
      yellowgreen: [154, 205, 50]
    };
    var reverseNames = /* @__PURE__ */ Object.create(null);
    for (const name in cssKeywords) {
      if (Object.hasOwn(cssKeywords, name)) {
        reverseNames[cssKeywords[name]] = name;
      }
    }
    var cs = {
      to: {},
      get: {}
    };
    cs.get = function(string) {
      const prefix = string.slice(0, 3).toLowerCase();
      let value;
      let model;
      switch (prefix) {
        case "hsl": {
          value = cs.get.hsl(string);
          model = "hsl";
          break;
        }
        case "hwb": {
          value = cs.get.hwb(string);
          model = "hwb";
          break;
        }
        default: {
          value = cs.get.rgb(string);
          model = "rgb";
          break;
        }
      }
      if (!value) {
        return null;
      }
      return { model, value };
    };
    cs.get.rgb = function(string) {
      if (!string) {
        return null;
      }
      const abbr = /^#([a-f\d]{3,4})$/i;
      const hex2 = /^#([a-f\d]{6})([a-f\d]{2})?$/i;
      const rgba = /^rgba?\(\s*([+-]?\d+)(?=[\s,])\s*(?:,\s*)?([+-]?\d+)(?=[\s,])\s*(?:,\s*)?([+-]?\d+)\s*(?:[\s,|/]\s*([+-]?[\d.]+)(%?)\s*)?\)$/;
      const per = /^rgba?\(\s*([+-]?[\d.]+)%\s*,?\s*([+-]?[\d.]+)%\s*,?\s*([+-]?[\d.]+)%\s*(?:[\s,|/]\s*([+-]?[\d.]+)(%?)\s*)?\)$/;
      const keyword = /^(\w+)$/;
      let rgb = [0, 0, 0, 1];
      let match;
      let i;
      let hexAlpha;
      if (match = string.match(hex2)) {
        hexAlpha = match[2];
        match = match[1];
        for (i = 0; i < 3; i++) {
          const i2 = i * 2;
          rgb[i] = Number.parseInt(match.slice(i2, i2 + 2), 16);
        }
        if (hexAlpha) {
          rgb[3] = Number.parseInt(hexAlpha, 16) / 255;
        }
      } else if (match = string.match(abbr)) {
        match = match[1];
        hexAlpha = match[3];
        for (i = 0; i < 3; i++) {
          rgb[i] = Number.parseInt(match[i] + match[i], 16);
        }
        if (hexAlpha) {
          rgb[3] = Number.parseInt(hexAlpha + hexAlpha, 16) / 255;
        }
      } else if (match = string.match(rgba)) {
        for (i = 0; i < 3; i++) {
          rgb[i] = Number.parseInt(match[i + 1], 10);
        }
        if (match[4]) {
          rgb[3] = match[5] ? Number.parseFloat(match[4]) * 0.01 : Number.parseFloat(match[4]);
        }
      } else if (match = string.match(per)) {
        for (i = 0; i < 3; i++) {
          rgb[i] = Math.round(Number.parseFloat(match[i + 1]) * 2.55);
        }
        if (match[4]) {
          rgb[3] = match[5] ? Number.parseFloat(match[4]) * 0.01 : Number.parseFloat(match[4]);
        }
      } else if (match = string.match(keyword)) {
        if (match[1] === "transparent") {
          return [0, 0, 0, 0];
        }
        if (!Object.hasOwn(cssKeywords, match[1])) {
          return null;
        }
        rgb = cssKeywords[match[1]];
        rgb[3] = 1;
        return rgb;
      } else {
        return null;
      }
      for (i = 0; i < 3; i++) {
        rgb[i] = clamp(rgb[i], 0, 255);
      }
      rgb[3] = clamp(rgb[3], 0, 1);
      return rgb;
    };
    cs.get.hsl = function(string) {
      if (!string) {
        return null;
      }
      const hsl = /^hsla?\(\s*([+-]?(?:\d{0,3}\.)?\d+)(?:deg)?\s*,?\s*([+-]?[\d.]+)%\s*,?\s*([+-]?[\d.]+)%\s*(?:[,|/]\s*([+-]?(?=\.\d|\d)(?:0|[1-9]\d*)?(?:\.\d*)?(?:[eE][+-]?\d+)?)\s*)?\)$/;
      const match = string.match(hsl);
      if (match) {
        const alpha = Number.parseFloat(match[4]);
        const h = (Number.parseFloat(match[1]) % 360 + 360) % 360;
        const s = clamp(Number.parseFloat(match[2]), 0, 100);
        const l = clamp(Number.parseFloat(match[3]), 0, 100);
        const a = clamp(Number.isNaN(alpha) ? 1 : alpha, 0, 1);
        return [h, s, l, a];
      }
      return null;
    };
    cs.get.hwb = function(string) {
      if (!string) {
        return null;
      }
      const hwb = /^hwb\(\s*([+-]?\d{0,3}(?:\.\d+)?)(?:deg)?\s*[\s,]\s*([+-]?[\d.]+)%\s*[\s,]\s*([+-]?[\d.]+)%\s*(?:[\s,]\s*([+-]?(?=\.\d|\d)(?:0|[1-9]\d*)?(?:\.\d*)?(?:[eE][+-]?\d+)?)\s*)?\)$/;
      const match = string.match(hwb);
      if (match) {
        const alpha = Number.parseFloat(match[4]);
        const h = (Number.parseFloat(match[1]) % 360 + 360) % 360;
        const w = clamp(Number.parseFloat(match[2]), 0, 100);
        const b = clamp(Number.parseFloat(match[3]), 0, 100);
        const a = clamp(Number.isNaN(alpha) ? 1 : alpha, 0, 1);
        return [h, w, b, a];
      }
      return null;
    };
    cs.to.hex = function(...rgba) {
      return "#" + hexDouble(rgba[0]) + hexDouble(rgba[1]) + hexDouble(rgba[2]) + (rgba[3] < 1 ? hexDouble(Math.round(rgba[3] * 255)) : "");
    };
    cs.to.rgb = function(...rgba) {
      return rgba.length < 4 || rgba[3] === 1 ? "rgb(" + Math.round(rgba[0]) + ", " + Math.round(rgba[1]) + ", " + Math.round(rgba[2]) + ")" : "rgba(" + Math.round(rgba[0]) + ", " + Math.round(rgba[1]) + ", " + Math.round(rgba[2]) + ", " + rgba[3] + ")";
    };
    cs.to.rgb.percent = function(...rgba) {
      const r = Math.round(rgba[0] / 255 * 100);
      const g = Math.round(rgba[1] / 255 * 100);
      const b = Math.round(rgba[2] / 255 * 100);
      return rgba.length < 4 || rgba[3] === 1 ? "rgb(" + r + "%, " + g + "%, " + b + "%)" : "rgba(" + r + "%, " + g + "%, " + b + "%, " + rgba[3] + ")";
    };
    cs.to.hsl = function(...hsla) {
      return hsla.length < 4 || hsla[3] === 1 ? "hsl(" + hsla[0] + ", " + hsla[1] + "%, " + hsla[2] + "%)" : "hsla(" + hsla[0] + ", " + hsla[1] + "%, " + hsla[2] + "%, " + hsla[3] + ")";
    };
    cs.to.hwb = function(...hwba) {
      let a = "";
      if (hwba.length >= 4 && hwba[3] !== 1) {
        a = ", " + hwba[3];
      }
      return "hwb(" + hwba[0] + ", " + hwba[1] + "%, " + hwba[2] + "%" + a + ")";
    };
    cs.to.keyword = function(...rgb) {
      return reverseNames[rgb.slice(0, 3)];
    };
    function clamp(number_, min, max) {
      return Math.min(Math.max(min, number_), max);
    }
    __name(clamp, "clamp");
    function hexDouble(number_) {
      const string_ = Math.round(number_).toString(16).toUpperCase();
      return string_.length < 2 ? "0" + string_ : string_;
    }
    __name(hexDouble, "hexDouble");
    var reverseKeywords = {};
    for (const key of Object.keys(cssKeywords)) {
      reverseKeywords[cssKeywords[key]] = key;
    }
    var convert$1 = {
      rgb: { channels: 3, labels: "rgb" },
      hsl: { channels: 3, labels: "hsl" },
      hsv: { channels: 3, labels: "hsv" },
      hwb: { channels: 3, labels: "hwb" },
      cmyk: { channels: 4, labels: "cmyk" },
      xyz: { channels: 3, labels: "xyz" },
      lab: { channels: 3, labels: "lab" },
      oklab: { channels: 3, labels: ["okl", "oka", "okb"] },
      lch: { channels: 3, labels: "lch" },
      oklch: { channels: 3, labels: ["okl", "okc", "okh"] },
      hex: { channels: 1, labels: ["hex"] },
      keyword: { channels: 1, labels: ["keyword"] },
      ansi16: { channels: 1, labels: ["ansi16"] },
      ansi256: { channels: 1, labels: ["ansi256"] },
      hcg: { channels: 3, labels: ["h", "c", "g"] },
      apple: { channels: 3, labels: ["r16", "g16", "b16"] },
      gray: { channels: 1, labels: ["gray"] }
    };
    var LAB_FT = (6 / 29) ** 3;
    function srgbNonlinearTransform(c) {
      const cc = c > 31308e-7 ? 1.055 * c ** (1 / 2.4) - 0.055 : c * 12.92;
      return Math.min(Math.max(0, cc), 1);
    }
    __name(srgbNonlinearTransform, "srgbNonlinearTransform");
    function srgbNonlinearTransformInv(c) {
      return c > 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92;
    }
    __name(srgbNonlinearTransformInv, "srgbNonlinearTransformInv");
    for (const model of Object.keys(convert$1)) {
      if (!("channels" in convert$1[model])) {
        throw new Error("missing channels property: " + model);
      }
      if (!("labels" in convert$1[model])) {
        throw new Error("missing channel labels property: " + model);
      }
      if (convert$1[model].labels.length !== convert$1[model].channels) {
        throw new Error("channel and label counts mismatch: " + model);
      }
      const { channels, labels } = convert$1[model];
      delete convert$1[model].channels;
      delete convert$1[model].labels;
      Object.defineProperty(convert$1[model], "channels", { value: channels });
      Object.defineProperty(convert$1[model], "labels", { value: labels });
    }
    convert$1.rgb.hsl = function(rgb) {
      const r = rgb[0] / 255;
      const g = rgb[1] / 255;
      const b = rgb[2] / 255;
      const min = Math.min(r, g, b);
      const max = Math.max(r, g, b);
      const delta = max - min;
      let h;
      let s;
      switch (max) {
        case min: {
          h = 0;
          break;
        }
        case r: {
          h = (g - b) / delta;
          break;
        }
        case g: {
          h = 2 + (b - r) / delta;
          break;
        }
        case b: {
          h = 4 + (r - g) / delta;
          break;
        }
      }
      h = Math.min(h * 60, 360);
      if (h < 0) {
        h += 360;
      }
      const l = (min + max) / 2;
      if (max === min) {
        s = 0;
      } else if (l <= 0.5) {
        s = delta / (max + min);
      } else {
        s = delta / (2 - max - min);
      }
      return [h, s * 100, l * 100];
    };
    convert$1.rgb.hsv = function(rgb) {
      let rdif;
      let gdif;
      let bdif;
      let h;
      let s;
      const r = rgb[0] / 255;
      const g = rgb[1] / 255;
      const b = rgb[2] / 255;
      const v = Math.max(r, g, b);
      const diff = v - Math.min(r, g, b);
      const diffc = /* @__PURE__ */ __name(function(c) {
        return (v - c) / 6 / diff + 1 / 2;
      }, "diffc");
      if (diff === 0) {
        h = 0;
        s = 0;
      } else {
        s = diff / v;
        rdif = diffc(r);
        gdif = diffc(g);
        bdif = diffc(b);
        switch (v) {
          case r: {
            h = bdif - gdif;
            break;
          }
          case g: {
            h = 1 / 3 + rdif - bdif;
            break;
          }
          case b: {
            h = 2 / 3 + gdif - rdif;
            break;
          }
        }
        if (h < 0) {
          h += 1;
        } else if (h > 1) {
          h -= 1;
        }
      }
      return [
        h * 360,
        s * 100,
        v * 100
      ];
    };
    convert$1.rgb.hwb = function(rgb) {
      const r = rgb[0];
      const g = rgb[1];
      let b = rgb[2];
      const h = convert$1.rgb.hsl(rgb)[0];
      const w = 1 / 255 * Math.min(r, Math.min(g, b));
      b = 1 - 1 / 255 * Math.max(r, Math.max(g, b));
      return [h, w * 100, b * 100];
    };
    convert$1.rgb.oklab = function(rgb) {
      const r = srgbNonlinearTransformInv(rgb[0] / 255);
      const g = srgbNonlinearTransformInv(rgb[1] / 255);
      const b = srgbNonlinearTransformInv(rgb[2] / 255);
      const lp = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
      const mp = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
      const sp = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
      const l = 0.2104542553 * lp + 0.793617785 * mp - 0.0040720468 * sp;
      const aa = 1.9779984951 * lp - 2.428592205 * mp + 0.4505937099 * sp;
      const bb = 0.0259040371 * lp + 0.7827717662 * mp - 0.808675766 * sp;
      return [l * 100, aa * 100, bb * 100];
    };
    convert$1.rgb.cmyk = function(rgb) {
      const r = rgb[0] / 255;
      const g = rgb[1] / 255;
      const b = rgb[2] / 255;
      const k = Math.min(1 - r, 1 - g, 1 - b);
      const c = (1 - r - k) / (1 - k) || 0;
      const m = (1 - g - k) / (1 - k) || 0;
      const y = (1 - b - k) / (1 - k) || 0;
      return [c * 100, m * 100, y * 100, k * 100];
    };
    function comparativeDistance(x, y) {
      return (x[0] - y[0]) ** 2 + (x[1] - y[1]) ** 2 + (x[2] - y[2]) ** 2;
    }
    __name(comparativeDistance, "comparativeDistance");
    convert$1.rgb.keyword = function(rgb) {
      const reversed = reverseKeywords[rgb];
      if (reversed) {
        return reversed;
      }
      let currentClosestDistance = Number.POSITIVE_INFINITY;
      let currentClosestKeyword;
      for (const keyword of Object.keys(cssKeywords)) {
        const value = cssKeywords[keyword];
        const distance = comparativeDistance(rgb, value);
        if (distance < currentClosestDistance) {
          currentClosestDistance = distance;
          currentClosestKeyword = keyword;
        }
      }
      return currentClosestKeyword;
    };
    convert$1.keyword.rgb = function(keyword) {
      return cssKeywords[keyword];
    };
    convert$1.rgb.xyz = function(rgb) {
      const r = srgbNonlinearTransformInv(rgb[0] / 255);
      const g = srgbNonlinearTransformInv(rgb[1] / 255);
      const b = srgbNonlinearTransformInv(rgb[2] / 255);
      const x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375;
      const y = r * 0.2126729 + g * 0.7151522 + b * 0.072175;
      const z = r * 0.0193339 + g * 0.119192 + b * 0.9503041;
      return [x * 100, y * 100, z * 100];
    };
    convert$1.rgb.lab = function(rgb) {
      const xyz = convert$1.rgb.xyz(rgb);
      let x = xyz[0];
      let y = xyz[1];
      let z = xyz[2];
      x /= 95.047;
      y /= 100;
      z /= 108.883;
      x = x > LAB_FT ? x ** (1 / 3) : 7.787 * x + 16 / 116;
      y = y > LAB_FT ? y ** (1 / 3) : 7.787 * y + 16 / 116;
      z = z > LAB_FT ? z ** (1 / 3) : 7.787 * z + 16 / 116;
      const l = 116 * y - 16;
      const a = 500 * (x - y);
      const b = 200 * (y - z);
      return [l, a, b];
    };
    convert$1.hsl.rgb = function(hsl) {
      const h = hsl[0] / 360;
      const s = hsl[1] / 100;
      const l = hsl[2] / 100;
      let t3;
      let value;
      if (s === 0) {
        value = l * 255;
        return [value, value, value];
      }
      const t2 = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const t1 = 2 * l - t2;
      const rgb = [0, 0, 0];
      for (let i = 0; i < 3; i++) {
        t3 = h + 1 / 3 * -(i - 1);
        if (t3 < 0) {
          t3++;
        }
        if (t3 > 1) {
          t3--;
        }
        if (6 * t3 < 1) {
          value = t1 + (t2 - t1) * 6 * t3;
        } else if (2 * t3 < 1) {
          value = t2;
        } else if (3 * t3 < 2) {
          value = t1 + (t2 - t1) * (2 / 3 - t3) * 6;
        } else {
          value = t1;
        }
        rgb[i] = value * 255;
      }
      return rgb;
    };
    convert$1.hsl.hsv = function(hsl) {
      const h = hsl[0];
      let s = hsl[1] / 100;
      let l = hsl[2] / 100;
      let smin = s;
      const lmin = Math.max(l, 0.01);
      l *= 2;
      s *= l <= 1 ? l : 2 - l;
      smin *= lmin <= 1 ? lmin : 2 - lmin;
      const v = (l + s) / 2;
      const sv = l === 0 ? 2 * smin / (lmin + smin) : 2 * s / (l + s);
      return [h, sv * 100, v * 100];
    };
    convert$1.hsv.rgb = function(hsv) {
      const h = hsv[0] / 60;
      const s = hsv[1] / 100;
      let v = hsv[2] / 100;
      const hi = Math.floor(h) % 6;
      const f = h - Math.floor(h);
      const p = 255 * v * (1 - s);
      const q = 255 * v * (1 - s * f);
      const t = 255 * v * (1 - s * (1 - f));
      v *= 255;
      switch (hi) {
        case 0: {
          return [v, t, p];
        }
        case 1: {
          return [q, v, p];
        }
        case 2: {
          return [p, v, t];
        }
        case 3: {
          return [p, q, v];
        }
        case 4: {
          return [t, p, v];
        }
        case 5: {
          return [v, p, q];
        }
      }
    };
    convert$1.hsv.hsl = function(hsv) {
      const h = hsv[0];
      const s = hsv[1] / 100;
      const v = hsv[2] / 100;
      const vmin = Math.max(v, 0.01);
      let sl;
      let l;
      l = (2 - s) * v;
      const lmin = (2 - s) * vmin;
      sl = s * vmin;
      sl /= lmin <= 1 ? lmin : 2 - lmin;
      sl = sl || 0;
      l /= 2;
      return [h, sl * 100, l * 100];
    };
    convert$1.hwb.rgb = function(hwb) {
      const h = hwb[0] / 360;
      let wh = hwb[1] / 100;
      let bl = hwb[2] / 100;
      const ratio = wh + bl;
      let f;
      if (ratio > 1) {
        wh /= ratio;
        bl /= ratio;
      }
      const i = Math.floor(6 * h);
      const v = 1 - bl;
      f = 6 * h - i;
      if ((i & 1) !== 0) {
        f = 1 - f;
      }
      const n = wh + f * (v - wh);
      let r;
      let g;
      let b;
      switch (i) {
        default:
        case 6:
        case 0: {
          r = v;
          g = n;
          b = wh;
          break;
        }
        case 1: {
          r = n;
          g = v;
          b = wh;
          break;
        }
        case 2: {
          r = wh;
          g = v;
          b = n;
          break;
        }
        case 3: {
          r = wh;
          g = n;
          b = v;
          break;
        }
        case 4: {
          r = n;
          g = wh;
          b = v;
          break;
        }
        case 5: {
          r = v;
          g = wh;
          b = n;
          break;
        }
      }
      return [r * 255, g * 255, b * 255];
    };
    convert$1.cmyk.rgb = function(cmyk) {
      const c = cmyk[0] / 100;
      const m = cmyk[1] / 100;
      const y = cmyk[2] / 100;
      const k = cmyk[3] / 100;
      const r = 1 - Math.min(1, c * (1 - k) + k);
      const g = 1 - Math.min(1, m * (1 - k) + k);
      const b = 1 - Math.min(1, y * (1 - k) + k);
      return [r * 255, g * 255, b * 255];
    };
    convert$1.xyz.rgb = function(xyz) {
      const x = xyz[0] / 100;
      const y = xyz[1] / 100;
      const z = xyz[2] / 100;
      let r;
      let g;
      let b;
      r = x * 3.2404542 + y * -1.5371385 + z * -0.4985314;
      g = x * -0.969266 + y * 1.8760108 + z * 0.041556;
      b = x * 0.0556434 + y * -0.2040259 + z * 1.0572252;
      r = srgbNonlinearTransform(r);
      g = srgbNonlinearTransform(g);
      b = srgbNonlinearTransform(b);
      return [r * 255, g * 255, b * 255];
    };
    convert$1.xyz.lab = function(xyz) {
      let x = xyz[0];
      let y = xyz[1];
      let z = xyz[2];
      x /= 95.047;
      y /= 100;
      z /= 108.883;
      x = x > LAB_FT ? x ** (1 / 3) : 7.787 * x + 16 / 116;
      y = y > LAB_FT ? y ** (1 / 3) : 7.787 * y + 16 / 116;
      z = z > LAB_FT ? z ** (1 / 3) : 7.787 * z + 16 / 116;
      const l = 116 * y - 16;
      const a = 500 * (x - y);
      const b = 200 * (y - z);
      return [l, a, b];
    };
    convert$1.xyz.oklab = function(xyz) {
      const x = xyz[0] / 100;
      const y = xyz[1] / 100;
      const z = xyz[2] / 100;
      const lp = Math.cbrt(0.8189330101 * x + 0.3618667424 * y - 0.1288597137 * z);
      const mp = Math.cbrt(0.0329845436 * x + 0.9293118715 * y + 0.0361456387 * z);
      const sp = Math.cbrt(0.0482003018 * x + 0.2643662691 * y + 0.633851707 * z);
      const l = 0.2104542553 * lp + 0.793617785 * mp - 0.0040720468 * sp;
      const a = 1.9779984951 * lp - 2.428592205 * mp + 0.4505937099 * sp;
      const b = 0.0259040371 * lp + 0.7827717662 * mp - 0.808675766 * sp;
      return [l * 100, a * 100, b * 100];
    };
    convert$1.oklab.oklch = function(oklab) {
      return convert$1.lab.lch(oklab);
    };
    convert$1.oklab.xyz = function(oklab) {
      const ll = oklab[0] / 100;
      const a = oklab[1] / 100;
      const b = oklab[2] / 100;
      const l = (0.999999998 * ll + 0.396337792 * a + 0.215803758 * b) ** 3;
      const m = (1.000000008 * ll - 0.105561342 * a - 0.063854175 * b) ** 3;
      const s = (1.000000055 * ll - 0.089484182 * a - 1.291485538 * b) ** 3;
      const x = 1.227013851 * l - 0.55779998 * m + 0.281256149 * s;
      const y = -0.040580178 * l + 1.11225687 * m - 0.071676679 * s;
      const z = -0.076381285 * l - 0.421481978 * m + 1.58616322 * s;
      return [x * 100, y * 100, z * 100];
    };
    convert$1.oklab.rgb = function(oklab) {
      const ll = oklab[0] / 100;
      const aa = oklab[1] / 100;
      const bb = oklab[2] / 100;
      const l = (ll + 0.3963377774 * aa + 0.2158037573 * bb) ** 3;
      const m = (ll - 0.1055613458 * aa - 0.0638541728 * bb) ** 3;
      const s = (ll - 0.0894841775 * aa - 1.291485548 * bb) ** 3;
      const r = srgbNonlinearTransform(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s);
      const g = srgbNonlinearTransform(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s);
      const b = srgbNonlinearTransform(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s);
      return [r * 255, g * 255, b * 255];
    };
    convert$1.oklch.oklab = function(oklch) {
      return convert$1.lch.lab(oklch);
    };
    convert$1.lab.xyz = function(lab) {
      const l = lab[0];
      const a = lab[1];
      const b = lab[2];
      let x;
      let y;
      let z;
      y = (l + 16) / 116;
      x = a / 500 + y;
      z = y - b / 200;
      const y2 = y ** 3;
      const x2 = x ** 3;
      const z2 = z ** 3;
      y = y2 > LAB_FT ? y2 : (y - 16 / 116) / 7.787;
      x = x2 > LAB_FT ? x2 : (x - 16 / 116) / 7.787;
      z = z2 > LAB_FT ? z2 : (z - 16 / 116) / 7.787;
      x *= 95.047;
      y *= 100;
      z *= 108.883;
      return [x, y, z];
    };
    convert$1.lab.lch = function(lab) {
      const l = lab[0];
      const a = lab[1];
      const b = lab[2];
      let h;
      const hr = Math.atan2(b, a);
      h = hr * 360 / 2 / Math.PI;
      if (h < 0) {
        h += 360;
      }
      const c = Math.sqrt(a * a + b * b);
      return [l, c, h];
    };
    convert$1.lch.lab = function(lch) {
      const l = lch[0];
      const c = lch[1];
      const h = lch[2];
      const hr = h / 360 * 2 * Math.PI;
      const a = c * Math.cos(hr);
      const b = c * Math.sin(hr);
      return [l, a, b];
    };
    convert$1.rgb.ansi16 = function(args, saturation = null) {
      const [r, g, b] = args;
      let value = saturation === null ? convert$1.rgb.hsv(args)[2] : saturation;
      value = Math.round(value / 50);
      if (value === 0) {
        return 30;
      }
      let ansi = 30 + (Math.round(b / 255) << 2 | Math.round(g / 255) << 1 | Math.round(r / 255));
      if (value === 2) {
        ansi += 60;
      }
      return ansi;
    };
    convert$1.hsv.ansi16 = function(args) {
      return convert$1.rgb.ansi16(convert$1.hsv.rgb(args), args[2]);
    };
    convert$1.rgb.ansi256 = function(args) {
      const r = args[0];
      const g = args[1];
      const b = args[2];
      if (r >> 4 === g >> 4 && g >> 4 === b >> 4) {
        if (r < 8) {
          return 16;
        }
        if (r > 248) {
          return 231;
        }
        return Math.round((r - 8) / 247 * 24) + 232;
      }
      const ansi = 16 + 36 * Math.round(r / 255 * 5) + 6 * Math.round(g / 255 * 5) + Math.round(b / 255 * 5);
      return ansi;
    };
    convert$1.ansi16.rgb = function(args) {
      args = args[0];
      let color = args % 10;
      if (color === 0 || color === 7) {
        if (args > 50) {
          color += 3.5;
        }
        color = color / 10.5 * 255;
        return [color, color, color];
      }
      const mult = (Math.trunc(args > 50) + 1) * 0.5;
      const r = (color & 1) * mult * 255;
      const g = (color >> 1 & 1) * mult * 255;
      const b = (color >> 2 & 1) * mult * 255;
      return [r, g, b];
    };
    convert$1.ansi256.rgb = function(args) {
      args = args[0];
      if (args >= 232) {
        const c = (args - 232) * 10 + 8;
        return [c, c, c];
      }
      args -= 16;
      let rem;
      const r = Math.floor(args / 36) / 5 * 255;
      const g = Math.floor((rem = args % 36) / 6) / 5 * 255;
      const b = rem % 6 / 5 * 255;
      return [r, g, b];
    };
    convert$1.rgb.hex = function(args) {
      const integer = ((Math.round(args[0]) & 255) << 16) + ((Math.round(args[1]) & 255) << 8) + (Math.round(args[2]) & 255);
      const string = integer.toString(16).toUpperCase();
      return "000000".slice(string.length) + string;
    };
    convert$1.hex.rgb = function(args) {
      const match = args.toString(16).match(/[a-f\d]{6}|[a-f\d]{3}/i);
      if (!match) {
        return [0, 0, 0];
      }
      let colorString = match[0];
      if (match[0].length === 3) {
        colorString = [...colorString].map((char) => char + char).join("");
      }
      const integer = Number.parseInt(colorString, 16);
      const r = integer >> 16 & 255;
      const g = integer >> 8 & 255;
      const b = integer & 255;
      return [r, g, b];
    };
    convert$1.rgb.hcg = function(rgb) {
      const r = rgb[0] / 255;
      const g = rgb[1] / 255;
      const b = rgb[2] / 255;
      const max = Math.max(Math.max(r, g), b);
      const min = Math.min(Math.min(r, g), b);
      const chroma = max - min;
      let hue;
      const grayscale = chroma < 1 ? min / (1 - chroma) : 0;
      if (chroma <= 0) {
        hue = 0;
      } else if (max === r) {
        hue = (g - b) / chroma % 6;
      } else if (max === g) {
        hue = 2 + (b - r) / chroma;
      } else {
        hue = 4 + (r - g) / chroma;
      }
      hue /= 6;
      hue %= 1;
      return [hue * 360, chroma * 100, grayscale * 100];
    };
    convert$1.hsl.hcg = function(hsl) {
      const s = hsl[1] / 100;
      const l = hsl[2] / 100;
      const c = l < 0.5 ? 2 * s * l : 2 * s * (1 - l);
      let f = 0;
      if (c < 1) {
        f = (l - 0.5 * c) / (1 - c);
      }
      return [hsl[0], c * 100, f * 100];
    };
    convert$1.hsv.hcg = function(hsv) {
      const s = hsv[1] / 100;
      const v = hsv[2] / 100;
      const c = s * v;
      let f = 0;
      if (c < 1) {
        f = (v - c) / (1 - c);
      }
      return [hsv[0], c * 100, f * 100];
    };
    convert$1.hcg.rgb = function(hcg) {
      const h = hcg[0] / 360;
      const c = hcg[1] / 100;
      const g = hcg[2] / 100;
      if (c === 0) {
        return [g * 255, g * 255, g * 255];
      }
      const pure = [0, 0, 0];
      const hi = h % 1 * 6;
      const v = hi % 1;
      const w = 1 - v;
      let mg = 0;
      switch (Math.floor(hi)) {
        case 0: {
          pure[0] = 1;
          pure[1] = v;
          pure[2] = 0;
          break;
        }
        case 1: {
          pure[0] = w;
          pure[1] = 1;
          pure[2] = 0;
          break;
        }
        case 2: {
          pure[0] = 0;
          pure[1] = 1;
          pure[2] = v;
          break;
        }
        case 3: {
          pure[0] = 0;
          pure[1] = w;
          pure[2] = 1;
          break;
        }
        case 4: {
          pure[0] = v;
          pure[1] = 0;
          pure[2] = 1;
          break;
        }
        default: {
          pure[0] = 1;
          pure[1] = 0;
          pure[2] = w;
        }
      }
      mg = (1 - c) * g;
      return [
        (c * pure[0] + mg) * 255,
        (c * pure[1] + mg) * 255,
        (c * pure[2] + mg) * 255
      ];
    };
    convert$1.hcg.hsv = function(hcg) {
      const c = hcg[1] / 100;
      const g = hcg[2] / 100;
      const v = c + g * (1 - c);
      let f = 0;
      if (v > 0) {
        f = c / v;
      }
      return [hcg[0], f * 100, v * 100];
    };
    convert$1.hcg.hsl = function(hcg) {
      const c = hcg[1] / 100;
      const g = hcg[2] / 100;
      const l = g * (1 - c) + 0.5 * c;
      let s = 0;
      if (l > 0 && l < 0.5) {
        s = c / (2 * l);
      } else if (l >= 0.5 && l < 1) {
        s = c / (2 * (1 - l));
      }
      return [hcg[0], s * 100, l * 100];
    };
    convert$1.hcg.hwb = function(hcg) {
      const c = hcg[1] / 100;
      const g = hcg[2] / 100;
      const v = c + g * (1 - c);
      return [hcg[0], (v - c) * 100, (1 - v) * 100];
    };
    convert$1.hwb.hcg = function(hwb) {
      const w = hwb[1] / 100;
      const b = hwb[2] / 100;
      const v = 1 - b;
      const c = v - w;
      let g = 0;
      if (c < 1) {
        g = (v - c) / (1 - c);
      }
      return [hwb[0], c * 100, g * 100];
    };
    convert$1.apple.rgb = function(apple) {
      return [apple[0] / 65535 * 255, apple[1] / 65535 * 255, apple[2] / 65535 * 255];
    };
    convert$1.rgb.apple = function(rgb) {
      return [rgb[0] / 255 * 65535, rgb[1] / 255 * 65535, rgb[2] / 255 * 65535];
    };
    convert$1.gray.rgb = function(args) {
      return [args[0] / 100 * 255, args[0] / 100 * 255, args[0] / 100 * 255];
    };
    convert$1.gray.hsl = function(args) {
      return [0, 0, args[0]];
    };
    convert$1.gray.hsv = convert$1.gray.hsl;
    convert$1.gray.hwb = function(gray) {
      return [0, 100, gray[0]];
    };
    convert$1.gray.cmyk = function(gray) {
      return [0, 0, 0, gray[0]];
    };
    convert$1.gray.lab = function(gray) {
      return [gray[0], 0, 0];
    };
    convert$1.gray.hex = function(gray) {
      const value = Math.round(gray[0] / 100 * 255) & 255;
      const integer = (value << 16) + (value << 8) + value;
      const string = integer.toString(16).toUpperCase();
      return "000000".slice(string.length) + string;
    };
    convert$1.rgb.gray = function(rgb) {
      const value = (rgb[0] + rgb[1] + rgb[2]) / 3;
      return [value / 255 * 100];
    };
    function buildGraph() {
      const graph = {};
      const models2 = Object.keys(convert$1);
      for (let { length } = models2, i = 0; i < length; i++) {
        graph[models2[i]] = {
          // http://jsperf.com/1-vs-infinity
          // micro-opt, but this is simple.
          distance: -1,
          parent: null
        };
      }
      return graph;
    }
    __name(buildGraph, "buildGraph");
    function deriveBFS(fromModel) {
      const graph = buildGraph();
      const queue = [fromModel];
      graph[fromModel].distance = 0;
      while (queue.length > 0) {
        const current = queue.pop();
        const adjacents = Object.keys(convert$1[current]);
        for (let { length } = adjacents, i = 0; i < length; i++) {
          const adjacent = adjacents[i];
          const node = graph[adjacent];
          if (node.distance === -1) {
            node.distance = graph[current].distance + 1;
            node.parent = current;
            queue.unshift(adjacent);
          }
        }
      }
      return graph;
    }
    __name(deriveBFS, "deriveBFS");
    function link(from, to) {
      return function(args) {
        return to(from(args));
      };
    }
    __name(link, "link");
    function wrapConversion(toModel, graph) {
      const path = [graph[toModel].parent, toModel];
      let fn = convert$1[graph[toModel].parent][toModel];
      let cur = graph[toModel].parent;
      while (graph[cur].parent) {
        path.unshift(graph[cur].parent);
        fn = link(convert$1[graph[cur].parent][cur], fn);
        cur = graph[cur].parent;
      }
      fn.conversion = path;
      return fn;
    }
    __name(wrapConversion, "wrapConversion");
    function route(fromModel) {
      const graph = deriveBFS(fromModel);
      const conversion = {};
      const models2 = Object.keys(graph);
      for (let { length } = models2, i = 0; i < length; i++) {
        const toModel = models2[i];
        const node = graph[toModel];
        if (node.parent === null) {
          continue;
        }
        conversion[toModel] = wrapConversion(toModel, graph);
      }
      return conversion;
    }
    __name(route, "route");
    var convert = {};
    var models = Object.keys(convert$1);
    function wrapRaw(fn) {
      const wrappedFn = /* @__PURE__ */ __name(function(...args) {
        const arg0 = args[0];
        if (arg0 === void 0 || arg0 === null) {
          return arg0;
        }
        if (arg0.length > 1) {
          args = arg0;
        }
        return fn(args);
      }, "wrappedFn");
      if ("conversion" in fn) {
        wrappedFn.conversion = fn.conversion;
      }
      return wrappedFn;
    }
    __name(wrapRaw, "wrapRaw");
    function wrapRounded(fn) {
      const wrappedFn = /* @__PURE__ */ __name(function(...args) {
        const arg0 = args[0];
        if (arg0 === void 0 || arg0 === null) {
          return arg0;
        }
        if (arg0.length > 1) {
          args = arg0;
        }
        const result = fn(args);
        if (typeof result === "object") {
          for (let { length } = result, i = 0; i < length; i++) {
            result[i] = Math.round(result[i]);
          }
        }
        return result;
      }, "wrappedFn");
      if ("conversion" in fn) {
        wrappedFn.conversion = fn.conversion;
      }
      return wrappedFn;
    }
    __name(wrapRounded, "wrapRounded");
    for (const fromModel of models) {
      convert[fromModel] = {};
      Object.defineProperty(convert[fromModel], "channels", { value: convert$1[fromModel].channels });
      Object.defineProperty(convert[fromModel], "labels", { value: convert$1[fromModel].labels });
      const routes = route(fromModel);
      const routeModels = Object.keys(routes);
      for (const toModel of routeModels) {
        const fn = routes[toModel];
        convert[fromModel][toModel] = wrapRounded(fn);
        convert[fromModel][toModel].raw = wrapRaw(fn);
      }
    }
    var skippedModels = [
      // To be honest, I don't really feel like keyword belongs in color convert, but eh.
      "keyword",
      // Gray conflicts with some method names, and has its own method defined.
      "gray",
      // Shouldn't really be in color-convert either...
      "hex"
    ];
    var hashedModelKeys = {};
    for (const model of Object.keys(convert)) {
      hashedModelKeys[[...convert[model].labels].sort().join("")] = model;
    }
    var limiters = {};
    function Color(object, model) {
      if (!(this instanceof Color)) {
        return new Color(object, model);
      }
      if (model && model in skippedModels) {
        model = null;
      }
      if (model && !(model in convert)) {
        throw new Error("Unknown model: " + model);
      }
      let i;
      let channels;
      if (object == null) {
        this.model = "rgb";
        this.color = [0, 0, 0];
        this.valpha = 1;
      } else if (object instanceof Color) {
        this.model = object.model;
        this.color = [...object.color];
        this.valpha = object.valpha;
      } else if (typeof object === "string") {
        const result = cs.get(object);
        if (result === null) {
          throw new Error("Unable to parse color from string: " + object);
        }
        this.model = result.model;
        channels = convert[this.model].channels;
        this.color = result.value.slice(0, channels);
        this.valpha = typeof result.value[channels] === "number" ? result.value[channels] : 1;
      } else if (object.length > 0) {
        this.model = model || "rgb";
        channels = convert[this.model].channels;
        const newArray = Array.prototype.slice.call(object, 0, channels);
        this.color = zeroArray(newArray, channels);
        this.valpha = typeof object[channels] === "number" ? object[channels] : 1;
      } else if (typeof object === "number") {
        this.model = "rgb";
        this.color = [
          object >> 16 & 255,
          object >> 8 & 255,
          object & 255
        ];
        this.valpha = 1;
      } else {
        this.valpha = 1;
        const keys = Object.keys(object);
        if ("alpha" in object) {
          keys.splice(keys.indexOf("alpha"), 1);
          this.valpha = typeof object.alpha === "number" ? object.alpha : 0;
        }
        const hashedKeys = keys.sort().join("");
        if (!(hashedKeys in hashedModelKeys)) {
          throw new Error("Unable to parse color from object: " + JSON.stringify(object));
        }
        this.model = hashedModelKeys[hashedKeys];
        const { labels } = convert[this.model];
        const color = [];
        for (i = 0; i < labels.length; i++) {
          color.push(object[labels[i]]);
        }
        this.color = zeroArray(color);
      }
      if (limiters[this.model]) {
        channels = convert[this.model].channels;
        for (i = 0; i < channels; i++) {
          const limit = limiters[this.model][i];
          if (limit) {
            this.color[i] = limit(this.color[i]);
          }
        }
      }
      this.valpha = Math.max(0, Math.min(1, this.valpha));
      if (Object.freeze) {
        Object.freeze(this);
      }
    }
    __name(Color, "Color");
    Color.prototype = {
      toString() {
        return this.string();
      },
      toJSON() {
        return this[this.model]();
      },
      string(places) {
        let self2 = this.model in cs.to ? this : this.rgb();
        self2 = self2.round(typeof places === "number" ? places : 1);
        const arguments_ = self2.valpha === 1 ? self2.color : [...self2.color, this.valpha];
        return cs.to[self2.model](...arguments_);
      },
      percentString(places) {
        const self2 = this.rgb().round(typeof places === "number" ? places : 1);
        const arguments_ = self2.valpha === 1 ? self2.color : [...self2.color, this.valpha];
        return cs.to.rgb.percent(...arguments_);
      },
      array() {
        return this.valpha === 1 ? [...this.color] : [...this.color, this.valpha];
      },
      object() {
        const result = {};
        const { channels } = convert[this.model];
        const { labels } = convert[this.model];
        for (let i = 0; i < channels; i++) {
          result[labels[i]] = this.color[i];
        }
        if (this.valpha !== 1) {
          result.alpha = this.valpha;
        }
        return result;
      },
      unitArray() {
        const rgb = this.rgb().color;
        rgb[0] /= 255;
        rgb[1] /= 255;
        rgb[2] /= 255;
        if (this.valpha !== 1) {
          rgb.push(this.valpha);
        }
        return rgb;
      },
      unitObject() {
        const rgb = this.rgb().object();
        rgb.r /= 255;
        rgb.g /= 255;
        rgb.b /= 255;
        if (this.valpha !== 1) {
          rgb.alpha = this.valpha;
        }
        return rgb;
      },
      round(places) {
        places = Math.max(places || 0, 0);
        return new Color([...this.color.map(roundToPlace(places)), this.valpha], this.model);
      },
      alpha(value) {
        if (value !== void 0) {
          return new Color([...this.color, Math.max(0, Math.min(1, value))], this.model);
        }
        return this.valpha;
      },
      // Rgb
      red: getset("rgb", 0, maxfn(255)),
      green: getset("rgb", 1, maxfn(255)),
      blue: getset("rgb", 2, maxfn(255)),
      hue: getset(["hsl", "hsv", "hsl", "hwb", "hcg"], 0, (value) => (value % 360 + 360) % 360),
      saturationl: getset("hsl", 1, maxfn(100)),
      lightness: getset("hsl", 2, maxfn(100)),
      saturationv: getset("hsv", 1, maxfn(100)),
      value: getset("hsv", 2, maxfn(100)),
      chroma: getset("hcg", 1, maxfn(100)),
      gray: getset("hcg", 2, maxfn(100)),
      white: getset("hwb", 1, maxfn(100)),
      wblack: getset("hwb", 2, maxfn(100)),
      cyan: getset("cmyk", 0, maxfn(100)),
      magenta: getset("cmyk", 1, maxfn(100)),
      yellow: getset("cmyk", 2, maxfn(100)),
      black: getset("cmyk", 3, maxfn(100)),
      x: getset("xyz", 0, maxfn(95.047)),
      y: getset("xyz", 1, maxfn(100)),
      z: getset("xyz", 2, maxfn(108.833)),
      l: getset("lab", 0, maxfn(100)),
      a: getset("lab", 1),
      b: getset("lab", 2),
      keyword(value) {
        if (value !== void 0) {
          return new Color(value);
        }
        return convert[this.model].keyword(this.color);
      },
      hex(value) {
        if (value !== void 0) {
          return new Color(value);
        }
        return cs.to.hex(...this.rgb().round().color);
      },
      hexa(value) {
        if (value !== void 0) {
          return new Color(value);
        }
        const rgbArray = this.rgb().round().color;
        let alphaHex = Math.round(this.valpha * 255).toString(16).toUpperCase();
        if (alphaHex.length === 1) {
          alphaHex = "0" + alphaHex;
        }
        return cs.to.hex(...rgbArray) + alphaHex;
      },
      rgbNumber() {
        const rgb = this.rgb().color;
        return (rgb[0] & 255) << 16 | (rgb[1] & 255) << 8 | rgb[2] & 255;
      },
      luminosity() {
        const rgb = this.rgb().color;
        const lum = [];
        for (const [i, element] of rgb.entries()) {
          const chan = element / 255;
          lum[i] = chan <= 0.04045 ? chan / 12.92 : ((chan + 0.055) / 1.055) ** 2.4;
        }
        return 0.2126 * lum[0] + 0.7152 * lum[1] + 0.0722 * lum[2];
      },
      contrast(color2) {
        const lum1 = this.luminosity();
        const lum2 = color2.luminosity();
        if (lum1 > lum2) {
          return (lum1 + 0.05) / (lum2 + 0.05);
        }
        return (lum2 + 0.05) / (lum1 + 0.05);
      },
      level(color2) {
        const contrastRatio = this.contrast(color2);
        if (contrastRatio >= 7) {
          return "AAA";
        }
        return contrastRatio >= 4.5 ? "AA" : "";
      },
      isDark() {
        const rgb = this.rgb().color;
        const yiq = (rgb[0] * 2126 + rgb[1] * 7152 + rgb[2] * 722) / 1e4;
        return yiq < 128;
      },
      isLight() {
        return !this.isDark();
      },
      negate() {
        const rgb = this.rgb();
        for (let i = 0; i < 3; i++) {
          rgb.color[i] = 255 - rgb.color[i];
        }
        return rgb;
      },
      lighten(ratio) {
        const hsl = this.hsl();
        hsl.color[2] += hsl.color[2] * ratio;
        return hsl;
      },
      darken(ratio) {
        const hsl = this.hsl();
        hsl.color[2] -= hsl.color[2] * ratio;
        return hsl;
      },
      saturate(ratio) {
        const hsl = this.hsl();
        hsl.color[1] += hsl.color[1] * ratio;
        return hsl;
      },
      desaturate(ratio) {
        const hsl = this.hsl();
        hsl.color[1] -= hsl.color[1] * ratio;
        return hsl;
      },
      whiten(ratio) {
        const hwb = this.hwb();
        hwb.color[1] += hwb.color[1] * ratio;
        return hwb;
      },
      blacken(ratio) {
        const hwb = this.hwb();
        hwb.color[2] += hwb.color[2] * ratio;
        return hwb;
      },
      grayscale() {
        const rgb = this.rgb().color;
        const value = rgb[0] * 0.3 + rgb[1] * 0.59 + rgb[2] * 0.11;
        return Color.rgb(value, value, value);
      },
      fade(ratio) {
        return this.alpha(this.valpha - this.valpha * ratio);
      },
      opaquer(ratio) {
        return this.alpha(this.valpha + this.valpha * ratio);
      },
      rotate(degrees) {
        const hsl = this.hsl();
        let hue = hsl.color[0];
        hue = (hue + degrees) % 360;
        hue = hue < 0 ? 360 + hue : hue;
        hsl.color[0] = hue;
        return hsl;
      },
      mix(mixinColor, weight) {
        if (!mixinColor || !mixinColor.rgb) {
          throw new Error('Argument to "mix" was not a Color instance, but rather an instance of ' + typeof mixinColor);
        }
        const color1 = mixinColor.rgb();
        const color2 = this.rgb();
        const p = weight === void 0 ? 0.5 : weight;
        const w = 2 * p - 1;
        const a = color1.alpha() - color2.alpha();
        const w1 = ((w * a === -1 ? w : (w + a) / (1 + w * a)) + 1) / 2;
        const w2 = 1 - w1;
        return Color.rgb(
          w1 * color1.red() + w2 * color2.red(),
          w1 * color1.green() + w2 * color2.green(),
          w1 * color1.blue() + w2 * color2.blue(),
          color1.alpha() * p + color2.alpha() * (1 - p)
        );
      }
    };
    for (const model of Object.keys(convert)) {
      if (skippedModels.includes(model)) {
        continue;
      }
      const { channels } = convert[model];
      Color.prototype[model] = function(...arguments_) {
        if (this.model === model) {
          return new Color(this);
        }
        if (arguments_.length > 0) {
          return new Color(arguments_, model);
        }
        return new Color([...assertArray(convert[this.model][model].raw(this.color)), this.valpha], model);
      };
      Color[model] = function(...arguments_) {
        let color = arguments_[0];
        if (typeof color === "number") {
          color = zeroArray(arguments_, channels);
        }
        return new Color(color, model);
      };
    }
    function roundTo(number, places) {
      return Number(number.toFixed(places));
    }
    __name(roundTo, "roundTo");
    function roundToPlace(places) {
      return function(number) {
        return roundTo(number, places);
      };
    }
    __name(roundToPlace, "roundToPlace");
    function getset(model, channel, modifier) {
      model = Array.isArray(model) ? model : [model];
      for (const m of model) {
        (limiters[m] ||= [])[channel] = modifier;
      }
      model = model[0];
      return function(value) {
        let result;
        if (value !== void 0) {
          if (modifier) {
            value = modifier(value);
          }
          result = this[model]();
          result.color[channel] = value;
          return result;
        }
        result = this[model]().color[channel];
        if (modifier) {
          result = modifier(result);
        }
        return result;
      };
    }
    __name(getset, "getset");
    function maxfn(max) {
      return function(v) {
        return Math.max(0, Math.min(max, v));
      };
    }
    __name(maxfn, "maxfn");
    function assertArray(value) {
      return Array.isArray(value) ? value : [value];
    }
    __name(assertArray, "assertArray");
    function zeroArray(array, length) {
      for (let i = 0; i < length; i++) {
        if (typeof array[i] !== "number") {
          array[i] = 0;
        }
      }
      return array;
    }
    __name(zeroArray, "zeroArray");
    function getDefaultExportFromCjs(x) {
      return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
    }
    __name(getDefaultExportFromCjs, "getDefaultExportFromCjs");
    var textHex = /* @__PURE__ */ __name(function hex2(str) {
      for (var i = 0, hash = 0; i < str.length; hash = str.charCodeAt(i++) + ((hash << 5) - hash)) ;
      var color = Math.floor(
        Math.abs(
          Math.sin(hash) * 1e4 % 1 * 16777216
        )
      ).toString(16);
      return "#" + Array(6 - color.length + 1).join("0") + color;
    }, "hex");
    var hex = /* @__PURE__ */ getDefaultExportFromCjs(textHex);
    function colorspace(namespace, delimiter) {
      const split = namespace.split(delimiter || ":");
      let base = hex(split[0]);
      if (!split.length) return base;
      for (let i = 0, l = split.length - 1; i < l; i++) {
        base = Color(base).mix(Color(hex(split[i + 1]))).saturate(1).hex();
      }
      return base;
    }
    __name(colorspace, "colorspace");
    module2.exports = colorspace;
  }
});

// node_modules/kuler/index.js
var require_kuler = __commonJS({
  "node_modules/kuler/index.js"(exports2, module2) {
    "use strict";
    function Kuler(text, color) {
      if (color) return new Kuler(text).style(color);
      if (!(this instanceof Kuler)) return new Kuler(text);
      this.text = text;
    }
    __name(Kuler, "Kuler");
    Kuler.prototype.prefix = "\x1B[";
    Kuler.prototype.suffix = "m";
    Kuler.prototype.hex = /* @__PURE__ */ __name(function hex(color) {
      color = color[0] === "#" ? color.substring(1) : color;
      if (color.length === 3) {
        color = color.split("");
        color[5] = color[2];
        color[4] = color[2];
        color[3] = color[1];
        color[2] = color[1];
        color[1] = color[0];
        color = color.join("");
      }
      var r = color.substring(0, 2), g = color.substring(2, 4), b = color.substring(4, 6);
      return [parseInt(r, 16), parseInt(g, 16), parseInt(b, 16)];
    }, "hex");
    Kuler.prototype.rgb = /* @__PURE__ */ __name(function rgb(r, g, b) {
      var red = r / 255 * 5, green = g / 255 * 5, blue = b / 255 * 5;
      return this.ansi(red, green, blue);
    }, "rgb");
    Kuler.prototype.ansi = /* @__PURE__ */ __name(function ansi(r, g, b) {
      var red = Math.round(r), green = Math.round(g), blue = Math.round(b);
      return 16 + red * 36 + green * 6 + blue;
    }, "ansi");
    Kuler.prototype.reset = /* @__PURE__ */ __name(function reset() {
      return this.prefix + "39;49" + this.suffix;
    }, "reset");
    Kuler.prototype.style = /* @__PURE__ */ __name(function style(color) {
      return this.prefix + "38;5;" + this.rgb.apply(this, this.hex(color)) + this.suffix + this.text + this.reset();
    }, "style");
    module2.exports = Kuler;
  }
});

// node_modules/@dabh/diagnostics/modifiers/namespace-ansi.js
var require_namespace_ansi = __commonJS({
  "node_modules/@dabh/diagnostics/modifiers/namespace-ansi.js"(exports2, module2) {
    var colorspace = require_index_cjs();
    var kuler = require_kuler();
    module2.exports = /* @__PURE__ */ __name(function ansiModifier(args, options) {
      var namespace = options.namespace;
      var ansi = options.colors !== false ? kuler(namespace + ":", colorspace(namespace)) : namespace + ":";
      args[0] = ansi + " " + args[0];
      return args;
    }, "ansiModifier");
  }
});

// node_modules/enabled/index.js
var require_enabled = __commonJS({
  "node_modules/enabled/index.js"(exports2, module2) {
    "use strict";
    module2.exports = /* @__PURE__ */ __name(function enabled(name, variable) {
      if (!variable) return false;
      var variables = variable.split(/[\s,]+/), i = 0;
      for (; i < variables.length; i++) {
        variable = variables[i].replace("*", ".*?");
        if ("-" === variable.charAt(0)) {
          if (new RegExp("^" + variable.substr(1) + "$").test(name)) {
            return false;
          }
          continue;
        }
        if (new RegExp("^" + variable + "$").test(name)) {
          return true;
        }
      }
      return false;
    }, "enabled");
  }
});

// node_modules/@dabh/diagnostics/adapters/index.js
var require_adapters = __commonJS({
  "node_modules/@dabh/diagnostics/adapters/index.js"(exports2, module2) {
    var enabled = require_enabled();
    module2.exports = /* @__PURE__ */ __name(function create(fn) {
      return /* @__PURE__ */ __name(function adapter(namespace) {
        try {
          return enabled(namespace, fn());
        } catch (e) {
        }
        return false;
      }, "adapter");
    }, "create");
  }
});

// node_modules/@dabh/diagnostics/adapters/process.env.js
var require_process_env = __commonJS({
  "node_modules/@dabh/diagnostics/adapters/process.env.js"(exports2, module2) {
    var adapter = require_adapters();
    module2.exports = adapter(/* @__PURE__ */ __name(function processenv() {
      return process.env.DEBUG || process.env.DIAGNOSTICS;
    }, "processenv"));
  }
});

// node_modules/@dabh/diagnostics/logger/console.js
var require_console2 = __commonJS({
  "node_modules/@dabh/diagnostics/logger/console.js"(exports2, module2) {
    module2.exports = function(meta, messages) {
      try {
        Function.prototype.apply.call(console.log, console, messages);
      } catch (e) {
      }
    };
  }
});

// node_modules/@dabh/diagnostics/node/development.js
var require_development = __commonJS({
  "node_modules/@dabh/diagnostics/node/development.js"(exports2, module2) {
    var create = require_diagnostics();
    var tty = require("tty").isatty(1);
    var diagnostics = create(/* @__PURE__ */ __name(function dev(namespace, options) {
      options = options || {};
      options.colors = "colors" in options ? options.colors : tty;
      options.namespace = namespace;
      options.prod = false;
      options.dev = true;
      if (!dev.enabled(namespace) && !(options.force || dev.force)) {
        return dev.nope(options);
      }
      return dev.yep(options);
    }, "dev"));
    diagnostics.modify(require_namespace_ansi());
    diagnostics.use(require_process_env());
    diagnostics.set(require_console2());
    module2.exports = diagnostics;
  }
});

// node_modules/@dabh/diagnostics/node/index.js
var require_node2 = __commonJS({
  "node_modules/@dabh/diagnostics/node/index.js"(exports2, module2) {
    if (process.env.NODE_ENV === "production") {
      module2.exports = require_production();
    } else {
      module2.exports = require_development();
    }
  }
});

// node_modules/winston/lib/winston/tail-file.js
var require_tail_file = __commonJS({
  "node_modules/winston/lib/winston/tail-file.js"(exports2, module2) {
    "use strict";
    var fs = require("fs");
    var { StringDecoder } = require("string_decoder");
    var { Stream } = require_readable();
    function noop() {
    }
    __name(noop, "noop");
    module2.exports = (options, iter) => {
      const buffer = Buffer.alloc(64 * 1024);
      const decode = new StringDecoder("utf8");
      const stream = new Stream();
      let buff = "";
      let pos = 0;
      let row = 0;
      if (options.start === -1) {
        delete options.start;
      }
      stream.readable = true;
      stream.destroy = () => {
        stream.destroyed = true;
        stream.emit("end");
        stream.emit("close");
      };
      fs.open(options.file, "a+", "0644", (err, fd) => {
        if (err) {
          if (!iter) {
            stream.emit("error", err);
          } else {
            iter(err);
          }
          stream.destroy();
          return;
        }
        (/* @__PURE__ */ __name(function read() {
          if (stream.destroyed) {
            fs.close(fd, noop);
            return;
          }
          return fs.read(fd, buffer, 0, buffer.length, pos, (error, bytes) => {
            if (error) {
              if (!iter) {
                stream.emit("error", error);
              } else {
                iter(error);
              }
              stream.destroy();
              return;
            }
            if (!bytes) {
              if (buff) {
                if (options.start == null || row > options.start) {
                  if (!iter) {
                    stream.emit("line", buff);
                  } else {
                    iter(null, buff);
                  }
                }
                row++;
                buff = "";
              }
              return setTimeout(read, 1e3);
            }
            let data = decode.write(buffer.slice(0, bytes));
            if (!iter) {
              stream.emit("data", data);
            }
            data = (buff + data).split(/\n+/);
            const l = data.length - 1;
            let i = 0;
            for (; i < l; i++) {
              if (options.start == null || row > options.start) {
                if (!iter) {
                  stream.emit("line", data[i]);
                } else {
                  iter(null, data[i]);
                }
              }
              row++;
            }
            buff = data[l];
            pos += bytes;
            return read();
          });
        }, "read"))();
      });
      if (!iter) {
        return stream;
      }
      return stream.destroy;
    };
  }
});

// node_modules/winston/lib/winston/transports/file.js
var require_file = __commonJS({
  "node_modules/winston/lib/winston/transports/file.js"(exports2, module2) {
    "use strict";
    var fs = require("fs");
    var path = require("path");
    var asyncSeries = require_series();
    var zlib = require("zlib");
    var { MESSAGE } = require_triple_beam();
    var { Stream, PassThrough } = require_readable();
    var TransportStream = require_winston_transport();
    var debug = require_node2()("winston:file");
    var os = require("os");
    var tailFile = require_tail_file();
    module2.exports = class File extends TransportStream {
      static {
        __name(this, "File");
      }
      /**
       * Constructor function for the File transport object responsible for
       * persisting log messages and metadata to one or more files.
       * @param {Object} options - Options for this instance.
       */
      constructor(options = {}) {
        super(options);
        this.name = options.name || "file";
        function throwIf(target, ...args) {
          args.slice(1).forEach((name) => {
            if (options[name]) {
              throw new Error(`Cannot set ${name} and ${target} together`);
            }
          });
        }
        __name(throwIf, "throwIf");
        this._stream = new PassThrough();
        this._stream.setMaxListeners(30);
        this._onError = this._onError.bind(this);
        if (options.filename || options.dirname) {
          throwIf("filename or dirname", "stream");
          this._basename = this.filename = options.filename ? path.basename(options.filename) : "winston.log";
          this.dirname = options.dirname || path.dirname(options.filename);
          this.options = options.options || { flags: "a" };
        } else if (options.stream) {
          console.warn("options.stream will be removed in winston@4. Use winston.transports.Stream");
          throwIf("stream", "filename", "maxsize");
          this._dest = this._stream.pipe(this._setupStream(options.stream));
          this.dirname = path.dirname(this._dest.path);
        } else {
          throw new Error("Cannot log to file without filename or stream.");
        }
        this.maxsize = options.maxsize || null;
        this.rotationFormat = options.rotationFormat || false;
        this.zippedArchive = options.zippedArchive || false;
        this.maxFiles = options.maxFiles || null;
        this.eol = typeof options.eol === "string" ? options.eol : os.EOL;
        this.tailable = options.tailable || false;
        this.lazy = options.lazy || false;
        this._size = 0;
        this._pendingSize = 0;
        this._created = 0;
        this._drain = false;
        this._opening = false;
        this._ending = false;
        this._fileExist = false;
        if (this.dirname) this._createLogDirIfNotExist(this.dirname);
        if (!this.lazy) this.open();
      }
      finishIfEnding() {
        if (this._ending) {
          if (this._opening) {
            this.once("open", () => {
              this._stream.once("finish", () => this.emit("finish"));
              setImmediate(() => this._stream.end());
            });
          } else {
            this._stream.once("finish", () => this.emit("finish"));
            setImmediate(() => this._stream.end());
          }
        }
      }
      /**
       * Called by Node.js Writable stream before emitting 'finish'.
       * Ensures all buffered data is flushed to the underlying file stream
       * before the transport signals completion.
       * @param {Function} callback - Callback to signal completion.
       * @private
       */
      _final(callback) {
        if (this._opening) {
          this.once("open", () => this._final(callback));
          return;
        }
        this._stream.end();
        if (!this._dest) {
          return callback();
        }
        if (this._dest.writableFinished) {
          return callback();
        }
        this._dest.once("finish", callback);
        this._dest.once("error", callback);
      }
      /**
       * Core logging method exposed to Winston. Metadata is optional.
       * @param {Object} info - TODO: add param description.
       * @param {Function} callback - TODO: add param description.
       * @returns {undefined}
       */
      log(info, callback = () => {
      }) {
        if (this.silent) {
          callback();
          return true;
        }
        if (this._drain) {
          this._stream.once("drain", () => {
            this._drain = false;
            this.log(info, callback);
          });
          return;
        }
        if (this._rotate) {
          this._stream.once("rotate", () => {
            this._rotate = false;
            this.log(info, callback);
          });
          return;
        }
        if (this.lazy) {
          if (!this._fileExist) {
            if (!this._opening) {
              this.open();
            }
            this.once("open", () => {
              this._fileExist = true;
              this.log(info, callback);
              return;
            });
            return;
          }
          if (this._needsNewFile(this._pendingSize)) {
            this._dest.once("close", () => {
              if (!this._opening) {
                this.open();
              }
              this.once("open", () => {
                this.log(info, callback);
                return;
              });
              return;
            });
            return;
          }
        }
        const output = `${info[MESSAGE]}${this.eol}`;
        const bytes = Buffer.byteLength(output);
        function logged() {
          this._size += bytes;
          this._pendingSize -= bytes;
          debug("logged %s %s", this._size, output);
          this.emit("logged", info);
          if (this._rotate) {
            return;
          }
          if (this._opening) {
            return;
          }
          if (!this._needsNewFile()) {
            return;
          }
          if (this.lazy) {
            this._endStream(() => {
              this.emit("fileclosed");
            });
            return;
          }
          this._rotate = true;
          this._endStream(() => this._rotateFile());
        }
        __name(logged, "logged");
        this._pendingSize += bytes;
        if (this._opening && !this.rotatedWhileOpening && this._needsNewFile(this._size + this._pendingSize)) {
          this.rotatedWhileOpening = true;
        }
        const written = this._stream.write(output, logged.bind(this));
        if (!written) {
          this._drain = true;
          this._stream.once("drain", () => {
            this._drain = false;
            callback();
          });
        } else {
          callback();
        }
        debug("written", written, this._drain);
        this.finishIfEnding();
        return written;
      }
      /**
       * Query the transport. Options object is optional.
       * @param {Object} options - Loggly-like query options for this instance.
       * @param {function} callback - Continuation to respond to when complete.
       * TODO: Refactor me.
       */
      query(options, callback) {
        if (typeof options === "function") {
          callback = options;
          options = {};
        }
        options = normalizeQuery(options);
        const file = path.join(this.dirname, this.filename);
        let buff = "";
        let results = [];
        let row = 0;
        const stream = fs.createReadStream(file, {
          encoding: "utf8"
        });
        stream.on("error", (err) => {
          if (stream.readable) {
            stream.destroy();
          }
          if (!callback) {
            return;
          }
          return err.code !== "ENOENT" ? callback(err) : callback(null, results);
        });
        stream.on("data", (data) => {
          data = (buff + data).split(/\n+/);
          const l = data.length - 1;
          let i = 0;
          for (; i < l; i++) {
            if (!options.start || row >= options.start) {
              add(data[i]);
            }
            row++;
          }
          buff = data[l];
        });
        stream.on("close", () => {
          if (buff) {
            add(buff, true);
          }
          if (options.order === "desc") {
            results = results.reverse();
          }
          if (callback) callback(null, results);
        });
        function add(buff2, attempt) {
          try {
            const log = JSON.parse(buff2);
            if (check(log)) {
              push(log);
            }
          } catch (e) {
            if (!attempt) {
              stream.emit("error", e);
            }
          }
        }
        __name(add, "add");
        function push(log) {
          if (options.rows && results.length >= options.rows && options.order !== "desc") {
            if (stream.readable) {
              stream.destroy();
            }
            return;
          }
          if (options.fields) {
            log = options.fields.reduce((obj, key) => {
              obj[key] = log[key];
              return obj;
            }, {});
          }
          if (options.order === "desc") {
            if (results.length >= options.rows) {
              results.shift();
            }
          }
          results.push(log);
        }
        __name(push, "push");
        function check(log) {
          if (!log) {
            return;
          }
          if (typeof log !== "object") {
            return;
          }
          const time = new Date(log.timestamp);
          if (options.from && time < options.from || options.until && time > options.until || options.level && options.level !== log.level) {
            return;
          }
          return true;
        }
        __name(check, "check");
        function normalizeQuery(options2) {
          options2 = options2 || {};
          options2.rows = options2.rows || options2.limit || 10;
          options2.start = options2.start || 0;
          options2.until = options2.until || /* @__PURE__ */ new Date();
          if (typeof options2.until !== "object") {
            options2.until = new Date(options2.until);
          }
          options2.from = options2.from || options2.until - 24 * 60 * 60 * 1e3;
          if (typeof options2.from !== "object") {
            options2.from = new Date(options2.from);
          }
          options2.order = options2.order || "desc";
          return options2;
        }
        __name(normalizeQuery, "normalizeQuery");
      }
      /**
       * Returns a log stream for this transport. Options object is optional.
       * @param {Object} options - Stream options for this instance.
       * @returns {Stream} - TODO: add return description.
       * TODO: Refactor me.
       */
      stream(options = {}) {
        const file = path.join(this.dirname, this.filename);
        const stream = new Stream();
        const tail = {
          file,
          start: options.start
        };
        stream.destroy = tailFile(tail, (err, line) => {
          if (err) {
            return stream.emit("error", err);
          }
          try {
            stream.emit("data", line);
            line = JSON.parse(line);
            stream.emit("log", line);
          } catch (e) {
            stream.emit("error", e);
          }
        });
        return stream;
      }
      /**
       * Checks to see the filesize of.
       * @returns {undefined}
       */
      open() {
        if (!this.filename) return;
        if (this._opening) return;
        this._opening = true;
        this.stat((err, size) => {
          if (err) {
            return this.emit("error", err);
          }
          debug("stat done: %s { size: %s }", this.filename, size);
          this._size = size;
          this._dest = this._createStream(this._stream);
          this._opening = false;
          this.once("open", () => {
            if (!this._stream.emit("rotate")) {
              this._rotate = false;
            }
          });
        });
      }
      /**
       * Stat the file and assess information in order to create the proper stream.
       * @param {function} callback - TODO: add param description.
       * @returns {undefined}
       */
      stat(callback) {
        const target = this._getFile();
        const fullpath = path.join(this.dirname, target);
        fs.stat(fullpath, (err, stat) => {
          if (err && err.code === "ENOENT") {
            debug("ENOENT\xA0ok", fullpath);
            this.filename = target;
            return callback(null, 0);
          }
          if (err) {
            debug(`err ${err.code} ${fullpath}`);
            return callback(err);
          }
          if (!stat || this._needsNewFile(stat.size)) {
            return this._incFile(() => this.stat(callback));
          }
          this.filename = target;
          callback(null, stat.size);
        });
      }
      /**
       * Closes the stream associated with this instance.
       * @param {function} cb - TODO: add param description.
       * @returns {undefined}
       */
      close(cb) {
        if (!this._stream) {
          return;
        }
        this._stream.end(() => {
          if (cb) {
            cb();
          }
          this.emit("flush");
          this.emit("closed");
        });
      }
      /**
       * TODO: add method description.
       * @param {number} size - TODO: add param description.
       * @returns {undefined}
       */
      _needsNewFile(size) {
        size = size || this._size;
        return this.maxsize && size >= this.maxsize;
      }
      /**
       * TODO: add method description.
       * @param {Error} err - TODO: add param description.
       * @returns {undefined}
       */
      _onError(err) {
        this.emit("error", err);
      }
      /**
       * TODO: add method description.
       * @param {Stream} stream - TODO: add param description.
       * @returns {mixed} - TODO: add return description.
       */
      _setupStream(stream) {
        stream.on("error", this._onError);
        return stream;
      }
      /**
       * TODO: add method description.
       * @param {Stream} stream - TODO: add param description.
       * @returns {mixed} - TODO: add return description.
       */
      _cleanupStream(stream) {
        stream.removeListener("error", this._onError);
        stream.destroy();
        return stream;
      }
      /**
       * TODO: add method description.
       */
      _rotateFile() {
        this._incFile(() => this.open());
      }
      /**
       * Unpipe from the stream that has been marked as full and end it so it
       * flushes to disk.
       *
       * @param {function} callback - Callback for when the current file has closed.
       * @private
       */
      _endStream(callback = () => {
      }) {
        if (this._dest) {
          this._stream.unpipe(this._dest);
          this._dest.end(() => {
            this._cleanupStream(this._dest);
            callback();
          });
        } else {
          callback();
        }
      }
      /**
       * Returns the WritableStream for the active file on this instance. If we
       * should gzip the file then a zlib stream is returned.
       *
       * @param {ReadableStream} source –PassThrough to pipe to the file when open.
       * @returns {WritableStream} Stream that writes to disk for the active file.
       */
      _createStream(source) {
        const fullpath = path.join(this.dirname, this.filename);
        debug("create stream start", fullpath, this.options);
        const dest = fs.createWriteStream(fullpath, this.options).on("error", (err) => debug(err)).on("close", () => debug("close", dest.path, dest.bytesWritten)).on("open", () => {
          debug("file open ok", fullpath);
          this.emit("open", fullpath);
          source.pipe(dest);
          if (this.rotatedWhileOpening) {
            this._stream = new PassThrough();
            this._stream.setMaxListeners(30);
            this._rotateFile();
            this.rotatedWhileOpening = false;
            this._cleanupStream(dest);
            source.end();
          }
        });
        debug("create stream ok", fullpath);
        return dest;
      }
      /**
       * TODO: add method description.
       * @param {function} callback - TODO: add param description.
       * @returns {undefined}
       */
      _incFile(callback) {
        debug("_incFile", this.filename);
        const ext = path.extname(this._basename);
        const basename = path.basename(this._basename, ext);
        const tasks = [];
        if (this.zippedArchive) {
          tasks.push(
            function(cb) {
              const num = this._created > 0 && !this.tailable ? this._created : "";
              this._compressFile(
                path.join(this.dirname, `${basename}${num}${ext}`),
                path.join(this.dirname, `${basename}${num}${ext}.gz`),
                cb
              );
            }.bind(this)
          );
        }
        tasks.push(
          function(cb) {
            if (!this.tailable) {
              this._created += 1;
              this._checkMaxFilesIncrementing(ext, basename, cb);
            } else {
              this._checkMaxFilesTailable(ext, basename, cb);
            }
          }.bind(this)
        );
        asyncSeries(tasks, callback);
      }
      /**
       * Gets the next filename to use for this instance in the case that log
       * filesizes are being capped.
       * @returns {string} - TODO: add return description.
       * @private
       */
      _getFile() {
        const ext = path.extname(this._basename);
        const basename = path.basename(this._basename, ext);
        const isRotation = this.rotationFormat ? this.rotationFormat() : this._created;
        return !this.tailable && this._created ? `${basename}${isRotation}${ext}` : `${basename}${ext}`;
      }
      /**
       * Increment the number of files created or checked by this instance.
       * @param {mixed} ext - TODO: add param description.
       * @param {mixed} basename - TODO: add param description.
       * @param {mixed} callback - TODO: add param description.
       * @returns {undefined}
       * @private
       */
      _checkMaxFilesIncrementing(ext, basename, callback) {
        if (!this.maxFiles || this._created < this.maxFiles) {
          return setImmediate(callback);
        }
        const oldest = this._created - this.maxFiles;
        const isOldest = oldest !== 0 ? oldest : "";
        const isZipped = this.zippedArchive ? ".gz" : "";
        const filePath = `${basename}${isOldest}${ext}${isZipped}`;
        const target = path.join(this.dirname, filePath);
        fs.unlink(target, callback);
      }
      /**
       * Roll files forward based on integer, up to maxFiles. e.g. if base if
       * file.log and it becomes oversized, roll to file1.log, and allow file.log
       * to be re-used. If file is oversized again, roll file1.log to file2.log,
       * roll file.log to file1.log, and so on.
       * @param {mixed} ext - TODO: add param description.
       * @param {mixed} basename - TODO: add param description.
       * @param {mixed} callback - TODO: add param description.
       * @returns {undefined}
       * @private
       */
      _checkMaxFilesTailable(ext, basename, callback) {
        const tasks = [];
        if (!this.maxFiles) {
          return;
        }
        const isZipped = this.zippedArchive ? ".gz" : "";
        for (let x = this.maxFiles - 1; x > 1; x--) {
          tasks.push(function(i, cb) {
            let fileName = `${basename}${i - 1}${ext}${isZipped}`;
            const tmppath = path.join(this.dirname, fileName);
            fs.exists(tmppath, (exists) => {
              if (!exists) {
                return cb(null);
              }
              fileName = `${basename}${i}${ext}${isZipped}`;
              fs.rename(tmppath, path.join(this.dirname, fileName), cb);
            });
          }.bind(this, x));
        }
        asyncSeries(tasks, () => {
          fs.rename(
            path.join(this.dirname, `${basename}${ext}${isZipped}`),
            path.join(this.dirname, `${basename}1${ext}${isZipped}`),
            callback
          );
        });
      }
      /**
       * Compresses src to dest with gzip and unlinks src
       * @param {string} src - path to source file.
       * @param {string} dest - path to zipped destination file.
       * @param {Function} callback - callback called after file has been compressed.
       * @returns {undefined}
       * @private
       */
      _compressFile(src, dest, callback) {
        fs.access(src, fs.F_OK, (err) => {
          if (err) {
            return callback();
          }
          var gzip = zlib.createGzip();
          var inp = fs.createReadStream(src);
          var out = fs.createWriteStream(dest);
          out.on("finish", () => {
            fs.unlink(src, callback);
          });
          inp.pipe(gzip).pipe(out);
        });
      }
      _createLogDirIfNotExist(dirPath) {
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
      }
    };
  }
});

// node_modules/winston/lib/winston/transports/http.js
var require_http = __commonJS({
  "node_modules/winston/lib/winston/transports/http.js"(exports2, module2) {
    "use strict";
    var http = require("http");
    var https = require("https");
    var { Stream } = require_readable();
    var TransportStream = require_winston_transport();
    var { configure } = require_safe_stable_stringify();
    module2.exports = class Http extends TransportStream {
      static {
        __name(this, "Http");
      }
      /**
       * Constructor function for the Http transport object responsible for
       * persisting log messages and metadata to a terminal or TTY.
       * @param {!Object} [options={}] - Options for this instance.
       */
      // eslint-disable-next-line max-statements
      constructor(options = {}) {
        super(options);
        this.options = options;
        this.name = options.name || "http";
        this.ssl = !!options.ssl;
        this.host = options.host || "localhost";
        this.port = options.port;
        this.auth = options.auth;
        this.path = options.path || "";
        this.maximumDepth = options.maximumDepth;
        this.agent = options.agent;
        this.headers = options.headers || {};
        this.headers["content-type"] = "application/json";
        this.batch = options.batch || false;
        this.batchInterval = options.batchInterval || 5e3;
        this.batchCount = options.batchCount || 10;
        this.batchOptions = [];
        this.batchTimeoutID = -1;
        this.batchCallback = {};
        if (!this.port) {
          this.port = this.ssl ? 443 : 80;
        }
      }
      /**
       * Core logging method exposed to Winston.
       * @param {Object} info - TODO: add param description.
       * @param {function} callback - TODO: add param description.
       * @returns {undefined}
       */
      log(info, callback) {
        this._request(info, null, null, (err, res) => {
          if (res && res.statusCode !== 200) {
            err = new Error(`Invalid HTTP Status Code: ${res.statusCode}`);
          }
          if (err) {
            this.emit("warn", err);
          } else {
            this.emit("logged", info);
          }
        });
        if (callback) {
          setImmediate(callback);
        }
      }
      /**
       * Query the transport. Options object is optional.
       * @param {Object} options -  Loggly-like query options for this instance.
       * @param {function} callback - Continuation to respond to when complete.
       * @returns {undefined}
       */
      query(options, callback) {
        if (typeof options === "function") {
          callback = options;
          options = {};
        }
        options = {
          method: "query",
          params: this.normalizeQuery(options)
        };
        const auth = options.params.auth || null;
        delete options.params.auth;
        const path = options.params.path || null;
        delete options.params.path;
        this._request(options, auth, path, (err, res, body) => {
          if (res && res.statusCode !== 200) {
            err = new Error(`Invalid HTTP Status Code: ${res.statusCode}`);
          }
          if (err) {
            return callback(err);
          }
          if (typeof body === "string") {
            try {
              body = JSON.parse(body);
            } catch (e) {
              return callback(e);
            }
          }
          callback(null, body);
        });
      }
      /**
       * Returns a log stream for this transport. Options object is optional.
       * @param {Object} options - Stream options for this instance.
       * @returns {Stream} - TODO: add return description
       */
      stream(options = {}) {
        const stream = new Stream();
        options = {
          method: "stream",
          params: options
        };
        const path = options.params.path || null;
        delete options.params.path;
        const auth = options.params.auth || null;
        delete options.params.auth;
        let buff = "";
        const req = this._request(options, auth, path);
        stream.destroy = () => req.destroy();
        req.on("data", (data) => {
          data = (buff + data).split(/\n+/);
          const l = data.length - 1;
          let i = 0;
          for (; i < l; i++) {
            try {
              stream.emit("log", JSON.parse(data[i]));
            } catch (e) {
              stream.emit("error", e);
            }
          }
          buff = data[l];
        });
        req.on("error", (err) => stream.emit("error", err));
        return stream;
      }
      /**
       * Make a request to a winstond server or any http server which can
       * handle json-rpc.
       * @param {function} options - Options to sent the request.
       * @param {Object?} auth - authentication options
       * @param {string} path - request path
       * @param {function} callback - Continuation to respond to when complete.
       */
      _request(options, auth, path, callback) {
        options = options || {};
        auth = auth || this.auth;
        path = path || this.path || "";
        if (this.batch) {
          this._doBatch(options, callback, auth, path);
        } else {
          this._doRequest(options, callback, auth, path);
        }
      }
      /**
       * Send or memorize the options according to batch configuration
       * @param {function} options - Options to sent the request.
       * @param {function} callback - Continuation to respond to when complete.
       * @param {Object?} auth - authentication options
       * @param {string} path - request path
       */
      _doBatch(options, callback, auth, path) {
        this.batchOptions.push(options);
        if (this.batchOptions.length === 1) {
          const me = this;
          this.batchCallback = callback;
          this.batchTimeoutID = setTimeout(function() {
            me.batchTimeoutID = -1;
            me._doBatchRequest(me.batchCallback, auth, path);
          }, this.batchInterval);
        }
        if (this.batchOptions.length === this.batchCount) {
          this._doBatchRequest(this.batchCallback, auth, path);
        }
      }
      /**
       * Initiate a request with the memorized batch options, stop the batch timeout
       * @param {function} callback - Continuation to respond to when complete.
       * @param {Object?} auth - authentication options
       * @param {string} path - request path
       */
      _doBatchRequest(callback, auth, path) {
        if (this.batchTimeoutID > 0) {
          clearTimeout(this.batchTimeoutID);
          this.batchTimeoutID = -1;
        }
        const batchOptionsCopy = this.batchOptions.slice();
        this.batchOptions = [];
        this._doRequest(batchOptionsCopy, callback, auth, path);
      }
      /**
       * Make a request to a winstond server or any http server which can
       * handle json-rpc.
       * @param {function} options - Options to sent the request.
       * @param {function} callback - Continuation to respond to when complete.
       * @param {Object?} auth - authentication options
       * @param {string} path - request path
       */
      _doRequest(options, callback, auth, path) {
        const headers = Object.assign({}, this.headers);
        if (auth && auth.bearer) {
          headers.Authorization = `Bearer ${auth.bearer}`;
        }
        const req = (this.ssl ? https : http).request({
          ...this.options,
          method: "POST",
          host: this.host,
          port: this.port,
          path: `/${path.replace(/^\//, "")}`,
          headers,
          auth: auth && auth.username && auth.password ? `${auth.username}:${auth.password}` : "",
          agent: this.agent
        });
        req.on("error", callback);
        req.on("response", (res) => res.on("end", () => callback(null, res)).resume());
        const jsonStringify = configure({
          ...this.maximumDepth && { maximumDepth: this.maximumDepth }
        });
        req.end(Buffer.from(jsonStringify(options, this.options.replacer), "utf8"));
      }
    };
  }
});

// node_modules/winston/node_modules/is-stream/index.js
var require_is_stream = __commonJS({
  "node_modules/winston/node_modules/is-stream/index.js"(exports2, module2) {
    "use strict";
    var isStream = /* @__PURE__ */ __name((stream) => stream !== null && typeof stream === "object" && typeof stream.pipe === "function", "isStream");
    isStream.writable = (stream) => isStream(stream) && stream.writable !== false && typeof stream._write === "function" && typeof stream._writableState === "object";
    isStream.readable = (stream) => isStream(stream) && stream.readable !== false && typeof stream._read === "function" && typeof stream._readableState === "object";
    isStream.duplex = (stream) => isStream.writable(stream) && isStream.readable(stream);
    isStream.transform = (stream) => isStream.duplex(stream) && typeof stream._transform === "function";
    module2.exports = isStream;
  }
});

// node_modules/winston/lib/winston/transports/stream.js
var require_stream3 = __commonJS({
  "node_modules/winston/lib/winston/transports/stream.js"(exports2, module2) {
    "use strict";
    var isStream = require_is_stream();
    var { MESSAGE } = require_triple_beam();
    var os = require("os");
    var TransportStream = require_winston_transport();
    module2.exports = class Stream extends TransportStream {
      static {
        __name(this, "Stream");
      }
      /**
       * Constructor function for the Console transport object responsible for
       * persisting log messages and metadata to a terminal or TTY.
       * @param {!Object} [options={}] - Options for this instance.
       */
      constructor(options = {}) {
        super(options);
        if (!options.stream || !isStream(options.stream)) {
          throw new Error("options.stream is required.");
        }
        this._stream = options.stream;
        this._stream.setMaxListeners(Infinity);
        this.isObjectMode = options.stream._writableState.objectMode;
        this.eol = typeof options.eol === "string" ? options.eol : os.EOL;
      }
      /**
       * Core logging method exposed to Winston.
       * @param {Object} info - TODO: add param description.
       * @param {Function} callback - TODO: add param description.
       * @returns {undefined}
       */
      log(info, callback) {
        setImmediate(() => this.emit("logged", info));
        if (this.isObjectMode) {
          this._stream.write(info);
          if (callback) {
            callback();
          }
          return;
        }
        this._stream.write(`${info[MESSAGE]}${this.eol}`);
        if (callback) {
          callback();
        }
        return;
      }
    };
  }
});

// node_modules/winston/lib/winston/transports/index.js
var require_transports = __commonJS({
  "node_modules/winston/lib/winston/transports/index.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "Console", {
      configurable: true,
      enumerable: true,
      get() {
        return require_console();
      }
    });
    Object.defineProperty(exports2, "File", {
      configurable: true,
      enumerable: true,
      get() {
        return require_file();
      }
    });
    Object.defineProperty(exports2, "Http", {
      configurable: true,
      enumerable: true,
      get() {
        return require_http();
      }
    });
    Object.defineProperty(exports2, "Stream", {
      configurable: true,
      enumerable: true,
      get() {
        return require_stream3();
      }
    });
  }
});

// node_modules/winston/lib/winston/config/index.js
var require_config2 = __commonJS({
  "node_modules/winston/lib/winston/config/index.js"(exports2) {
    "use strict";
    var logform = require_logform();
    var { configs } = require_triple_beam();
    exports2.cli = logform.levels(configs.cli);
    exports2.npm = logform.levels(configs.npm);
    exports2.syslog = logform.levels(configs.syslog);
    exports2.addColors = logform.levels;
  }
});

// node_modules/async/eachOf.js
var require_eachOf = __commonJS({
  "node_modules/async/eachOf.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    var _isArrayLike = require_isArrayLike();
    var _isArrayLike2 = _interopRequireDefault(_isArrayLike);
    var _breakLoop = require_breakLoop();
    var _breakLoop2 = _interopRequireDefault(_breakLoop);
    var _eachOfLimit = require_eachOfLimit2();
    var _eachOfLimit2 = _interopRequireDefault(_eachOfLimit);
    var _once = require_once();
    var _once2 = _interopRequireDefault(_once);
    var _onlyOnce = require_onlyOnce();
    var _onlyOnce2 = _interopRequireDefault(_onlyOnce);
    var _wrapAsync = require_wrapAsync();
    var _wrapAsync2 = _interopRequireDefault(_wrapAsync);
    var _awaitify = require_awaitify();
    var _awaitify2 = _interopRequireDefault(_awaitify);
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    __name(_interopRequireDefault, "_interopRequireDefault");
    function eachOfArrayLike(coll, iteratee, callback) {
      callback = (0, _once2.default)(callback);
      var index = 0, completed = 0, { length } = coll, canceled = false;
      if (length === 0) {
        callback(null);
      }
      function iteratorCallback(err, value) {
        if (err === false) {
          canceled = true;
        }
        if (canceled === true) return;
        if (err) {
          callback(err);
        } else if (++completed === length || value === _breakLoop2.default) {
          callback(null);
        }
      }
      __name(iteratorCallback, "iteratorCallback");
      for (; index < length; index++) {
        iteratee(coll[index], index, (0, _onlyOnce2.default)(iteratorCallback));
      }
    }
    __name(eachOfArrayLike, "eachOfArrayLike");
    function eachOfGeneric(coll, iteratee, callback) {
      return (0, _eachOfLimit2.default)(coll, Infinity, iteratee, callback);
    }
    __name(eachOfGeneric, "eachOfGeneric");
    function eachOf(coll, iteratee, callback) {
      var eachOfImplementation = (0, _isArrayLike2.default)(coll) ? eachOfArrayLike : eachOfGeneric;
      return eachOfImplementation(coll, (0, _wrapAsync2.default)(iteratee), callback);
    }
    __name(eachOf, "eachOf");
    exports2.default = (0, _awaitify2.default)(eachOf, 3);
    module2.exports = exports2.default;
  }
});

// node_modules/async/internal/withoutIndex.js
var require_withoutIndex = __commonJS({
  "node_modules/async/internal/withoutIndex.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = _withoutIndex;
    function _withoutIndex(iteratee) {
      return (value, index, callback) => iteratee(value, callback);
    }
    __name(_withoutIndex, "_withoutIndex");
    module2.exports = exports2.default;
  }
});

// node_modules/async/forEach.js
var require_forEach = __commonJS({
  "node_modules/async/forEach.js"(exports2, module2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    var _eachOf = require_eachOf();
    var _eachOf2 = _interopRequireDefault(_eachOf);
    var _withoutIndex = require_withoutIndex();
    var _withoutIndex2 = _interopRequireDefault(_withoutIndex);
    var _wrapAsync = require_wrapAsync();
    var _wrapAsync2 = _interopRequireDefault(_wrapAsync);
    var _awaitify = require_awaitify();
    var _awaitify2 = _interopRequireDefault(_awaitify);
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    __name(_interopRequireDefault, "_interopRequireDefault");
    function eachLimit(coll, iteratee, callback) {
      return (0, _eachOf2.default)(coll, (0, _withoutIndex2.default)((0, _wrapAsync2.default)(iteratee)), callback);
    }
    __name(eachLimit, "eachLimit");
    exports2.default = (0, _awaitify2.default)(eachLimit, 3);
    module2.exports = exports2.default;
  }
});

// node_modules/fn.name/index.js
var require_fn = __commonJS({
  "node_modules/fn.name/index.js"(exports2, module2) {
    "use strict";
    var toString = Object.prototype.toString;
    module2.exports = /* @__PURE__ */ __name(function name(fn) {
      if ("string" === typeof fn.displayName && fn.constructor.name) {
        return fn.displayName;
      } else if ("string" === typeof fn.name && fn.name) {
        return fn.name;
      }
      if ("object" === typeof fn && fn.constructor && "string" === typeof fn.constructor.name) return fn.constructor.name;
      var named = fn.toString(), type = toString.call(fn).slice(8, -1);
      if ("Function" === type) {
        named = named.substring(named.indexOf("(") + 1, named.indexOf(")"));
      } else {
        named = type;
      }
      return named || "anonymous";
    }, "name");
  }
});

// node_modules/one-time/index.js
var require_one_time = __commonJS({
  "node_modules/one-time/index.js"(exports2, module2) {
    "use strict";
    var name = require_fn();
    module2.exports = /* @__PURE__ */ __name(function one(fn) {
      var called = 0, value;
      function onetime() {
        if (called) return value;
        called = 1;
        value = fn.apply(this, arguments);
        fn = null;
        return value;
      }
      __name(onetime, "onetime");
      onetime.displayName = name(fn);
      return onetime;
    }, "one");
  }
});

// node_modules/stack-trace/lib/stack-trace.js
var require_stack_trace = __commonJS({
  "node_modules/stack-trace/lib/stack-trace.js"(exports2) {
    exports2.get = function(belowFn) {
      var oldLimit = Error.stackTraceLimit;
      Error.stackTraceLimit = Infinity;
      var dummyObject = {};
      var v8Handler = Error.prepareStackTrace;
      Error.prepareStackTrace = function(dummyObject2, v8StackTrace2) {
        return v8StackTrace2;
      };
      Error.captureStackTrace(dummyObject, belowFn || exports2.get);
      var v8StackTrace = dummyObject.stack;
      Error.prepareStackTrace = v8Handler;
      Error.stackTraceLimit = oldLimit;
      return v8StackTrace;
    };
    exports2.parse = function(err) {
      if (!err.stack) {
        return [];
      }
      var self2 = this;
      var lines = err.stack.split("\n").slice(1);
      return lines.map(function(line) {
        if (line.match(/^\s*[-]{4,}$/)) {
          return self2._createParsedCallSite({
            fileName: line,
            lineNumber: null,
            functionName: null,
            typeName: null,
            methodName: null,
            columnNumber: null,
            "native": null
          });
        }
        var lineMatch = line.match(/at (?:(.+)\s+\()?(?:(.+?):(\d+)(?::(\d+))?|([^)]+))\)?/);
        if (!lineMatch) {
          return;
        }
        var object = null;
        var method = null;
        var functionName = null;
        var typeName = null;
        var methodName = null;
        var isNative = lineMatch[5] === "native";
        if (lineMatch[1]) {
          functionName = lineMatch[1];
          var methodStart = functionName.lastIndexOf(".");
          if (functionName[methodStart - 1] == ".")
            methodStart--;
          if (methodStart > 0) {
            object = functionName.substr(0, methodStart);
            method = functionName.substr(methodStart + 1);
            var objectEnd = object.indexOf(".Module");
            if (objectEnd > 0) {
              functionName = functionName.substr(objectEnd + 1);
              object = object.substr(0, objectEnd);
            }
          }
          typeName = null;
        }
        if (method) {
          typeName = object;
          methodName = method;
        }
        if (method === "<anonymous>") {
          methodName = null;
          functionName = null;
        }
        var properties = {
          fileName: lineMatch[2] || null,
          lineNumber: parseInt(lineMatch[3], 10) || null,
          functionName,
          typeName,
          methodName,
          columnNumber: parseInt(lineMatch[4], 10) || null,
          "native": isNative
        };
        return self2._createParsedCallSite(properties);
      }).filter(function(callSite) {
        return !!callSite;
      });
    };
    function CallSite(properties) {
      for (var property in properties) {
        this[property] = properties[property];
      }
    }
    __name(CallSite, "CallSite");
    var strProperties = [
      "this",
      "typeName",
      "functionName",
      "methodName",
      "fileName",
      "lineNumber",
      "columnNumber",
      "function",
      "evalOrigin"
    ];
    var boolProperties = [
      "topLevel",
      "eval",
      "native",
      "constructor"
    ];
    strProperties.forEach(function(property) {
      CallSite.prototype[property] = null;
      CallSite.prototype["get" + property[0].toUpperCase() + property.substr(1)] = function() {
        return this[property];
      };
    });
    boolProperties.forEach(function(property) {
      CallSite.prototype[property] = false;
      CallSite.prototype["is" + property[0].toUpperCase() + property.substr(1)] = function() {
        return this[property];
      };
    });
    exports2._createParsedCallSite = function(properties) {
      return new CallSite(properties);
    };
  }
});

// node_modules/winston/lib/winston/exception-stream.js
var require_exception_stream = __commonJS({
  "node_modules/winston/lib/winston/exception-stream.js"(exports2, module2) {
    "use strict";
    var { Writable } = require_readable();
    module2.exports = class ExceptionStream extends Writable {
      static {
        __name(this, "ExceptionStream");
      }
      /**
       * Constructor function for the ExceptionStream responsible for wrapping a
       * TransportStream; only allowing writes of `info` objects with
       * `info.exception` set to true.
       * @param {!TransportStream} transport - Stream to filter to exceptions
       */
      constructor(transport) {
        super({ objectMode: true });
        if (!transport) {
          throw new Error("ExceptionStream requires a TransportStream instance.");
        }
        this.handleExceptions = true;
        this.transport = transport;
      }
      /**
       * Writes the info object to our transport instance if (and only if) the
       * `exception` property is set on the info.
       * @param {mixed} info - TODO: add param description.
       * @param {mixed} enc - TODO: add param description.
       * @param {mixed} callback - TODO: add param description.
       * @returns {mixed} - TODO: add return description.
       * @private
       */
      _write(info, enc, callback) {
        if (info.exception) {
          return this.transport.log(info, callback);
        }
        callback();
        return true;
      }
    };
  }
});

// node_modules/winston/lib/winston/exception-handler.js
var require_exception_handler = __commonJS({
  "node_modules/winston/lib/winston/exception-handler.js"(exports2, module2) {
    "use strict";
    var os = require("os");
    var asyncForEach = require_forEach();
    var debug = require_node2()("winston:exception");
    var once = require_one_time();
    var stackTrace = require_stack_trace();
    var ExceptionStream = require_exception_stream();
    module2.exports = class ExceptionHandler {
      static {
        __name(this, "ExceptionHandler");
      }
      /**
       * TODO: add contructor description
       * @param {!Logger} logger - TODO: add param description
       */
      constructor(logger) {
        if (!logger) {
          throw new Error("Logger is required to handle exceptions");
        }
        this.logger = logger;
        this.handlers = /* @__PURE__ */ new Map();
      }
      /**
       * Handles `uncaughtException` events for the current process by adding any
       * handlers passed in.
       * @returns {undefined}
       */
      handle(...args) {
        args.forEach((arg) => {
          if (Array.isArray(arg)) {
            return arg.forEach((handler) => this._addHandler(handler));
          }
          this._addHandler(arg);
        });
        if (!this.catcher) {
          this.catcher = this._uncaughtException.bind(this);
          process.on("uncaughtException", this.catcher);
        }
      }
      /**
       * Removes any handlers to `uncaughtException` events for the current
       * process. This does not modify the state of the `this.handlers` set.
       * @returns {undefined}
       */
      unhandle() {
        if (this.catcher) {
          process.removeListener("uncaughtException", this.catcher);
          this.catcher = false;
          Array.from(this.handlers.values()).forEach((wrapper) => this.logger.unpipe(wrapper));
        }
      }
      /**
       * TODO: add method description
       * @param {Error} err - Error to get information about.
       * @returns {mixed} - TODO: add return description.
       */
      getAllInfo(err) {
        let message = null;
        if (err) {
          message = typeof err === "string" ? err : err.message;
        }
        return {
          error: err,
          // TODO (indexzero): how do we configure this?
          level: "error",
          message: [
            `uncaughtException: ${message || "(no error message)"}`,
            err && err.stack || "  No stack trace"
          ].join("\n"),
          stack: err && err.stack,
          exception: true,
          date: (/* @__PURE__ */ new Date()).toString(),
          process: this.getProcessInfo(),
          os: this.getOsInfo(),
          trace: this.getTrace(err)
        };
      }
      /**
       * Gets all relevant process information for the currently running process.
       * @returns {mixed} - TODO: add return description.
       */
      getProcessInfo() {
        return {
          pid: process.pid,
          uid: process.getuid ? process.getuid() : null,
          gid: process.getgid ? process.getgid() : null,
          cwd: process.cwd(),
          execPath: process.execPath,
          version: process.version,
          argv: process.argv,
          memoryUsage: process.memoryUsage()
        };
      }
      /**
       * Gets all relevant OS information for the currently running process.
       * @returns {mixed} - TODO: add return description.
       */
      getOsInfo() {
        return {
          loadavg: os.loadavg(),
          uptime: os.uptime()
        };
      }
      /**
       * Gets a stack trace for the specified error.
       * @param {mixed} err - TODO: add param description.
       * @returns {mixed} - TODO: add return description.
       */
      getTrace(err) {
        const trace = err ? stackTrace.parse(err) : stackTrace.get();
        return trace.map((site) => {
          return {
            column: site.getColumnNumber(),
            file: site.getFileName(),
            function: site.getFunctionName(),
            line: site.getLineNumber(),
            method: site.getMethodName(),
            native: site.isNative()
          };
        });
      }
      /**
       * Helper method to add a transport as an exception handler.
       * @param {Transport} handler - The transport to add as an exception handler.
       * @returns {void}
       */
      _addHandler(handler) {
        if (!this.handlers.has(handler)) {
          handler.handleExceptions = true;
          const wrapper = new ExceptionStream(handler);
          this.handlers.set(handler, wrapper);
          this.logger.pipe(wrapper);
        }
      }
      /**
       * Logs all relevant information around the `err` and exits the current
       * process.
       * @param {Error} err - Error to handle
       * @returns {mixed} - TODO: add return description.
       * @private
       */
      _uncaughtException(err) {
        const info = this.getAllInfo(err);
        const handlers = this._getExceptionHandlers();
        let doExit = typeof this.logger.exitOnError === "function" ? this.logger.exitOnError(err) : this.logger.exitOnError;
        let timeout;
        if (!handlers.length && doExit) {
          console.warn("winston: exitOnError cannot be true with no exception handlers.");
          console.warn("winston: not exiting process.");
          doExit = false;
        }
        function gracefulExit() {
          debug("doExit", doExit);
          debug("process._exiting", process._exiting);
          if (doExit && !process._exiting) {
            if (timeout) {
              clearTimeout(timeout);
            }
            process.exit(1);
          }
        }
        __name(gracefulExit, "gracefulExit");
        if (!handlers || handlers.length === 0) {
          return process.nextTick(gracefulExit);
        }
        asyncForEach(handlers, (handler, next) => {
          const done = once(next);
          const transport = handler.transport || handler;
          function onDone(event) {
            return () => {
              debug(event);
              done();
            };
          }
          __name(onDone, "onDone");
          transport._ending = true;
          transport.once("finish", onDone("finished"));
          transport.once("error", onDone("error"));
        }, () => doExit && gracefulExit());
        this.logger.log(info);
        if (doExit) {
          timeout = setTimeout(gracefulExit, 3e3);
        }
      }
      /**
       * Returns the list of transports and exceptionHandlers for this instance.
       * @returns {Array} - List of transports and exceptionHandlers for this
       * instance.
       * @private
       */
      _getExceptionHandlers() {
        return this.logger.transports.filter((wrap) => {
          const transport = wrap.transport || wrap;
          return transport.handleExceptions;
        });
      }
    };
  }
});

// node_modules/winston/lib/winston/rejection-stream.js
var require_rejection_stream = __commonJS({
  "node_modules/winston/lib/winston/rejection-stream.js"(exports2, module2) {
    "use strict";
    var { Writable } = require_readable();
    module2.exports = class RejectionStream extends Writable {
      static {
        __name(this, "RejectionStream");
      }
      /**
       * Constructor function for the RejectionStream responsible for wrapping a
       * TransportStream; only allowing writes of `info` objects with
       * `info.rejection` set to true.
       * @param {!TransportStream} transport - Stream to filter to rejections
       */
      constructor(transport) {
        super({ objectMode: true });
        if (!transport) {
          throw new Error("RejectionStream requires a TransportStream instance.");
        }
        this.handleRejections = true;
        this.transport = transport;
      }
      /**
       * Writes the info object to our transport instance if (and only if) the
       * `rejection` property is set on the info.
       * @param {mixed} info - TODO: add param description.
       * @param {mixed} enc - TODO: add param description.
       * @param {mixed} callback - TODO: add param description.
       * @returns {mixed} - TODO: add return description.
       * @private
       */
      _write(info, enc, callback) {
        if (info.rejection) {
          return this.transport.log(info, callback);
        }
        callback();
        return true;
      }
    };
  }
});

// node_modules/winston/lib/winston/rejection-handler.js
var require_rejection_handler = __commonJS({
  "node_modules/winston/lib/winston/rejection-handler.js"(exports2, module2) {
    "use strict";
    var os = require("os");
    var asyncForEach = require_forEach();
    var debug = require_node2()("winston:rejection");
    var once = require_one_time();
    var stackTrace = require_stack_trace();
    var RejectionStream = require_rejection_stream();
    module2.exports = class RejectionHandler {
      static {
        __name(this, "RejectionHandler");
      }
      /**
       * TODO: add contructor description
       * @param {!Logger} logger - TODO: add param description
       */
      constructor(logger) {
        if (!logger) {
          throw new Error("Logger is required to handle rejections");
        }
        this.logger = logger;
        this.handlers = /* @__PURE__ */ new Map();
      }
      /**
       * Handles `unhandledRejection` events for the current process by adding any
       * handlers passed in.
       * @returns {undefined}
       */
      handle(...args) {
        args.forEach((arg) => {
          if (Array.isArray(arg)) {
            return arg.forEach((handler) => this._addHandler(handler));
          }
          this._addHandler(arg);
        });
        if (!this.catcher) {
          this.catcher = this._unhandledRejection.bind(this);
          process.on("unhandledRejection", this.catcher);
        }
      }
      /**
       * Removes any handlers to `unhandledRejection` events for the current
       * process. This does not modify the state of the `this.handlers` set.
       * @returns {undefined}
       */
      unhandle() {
        if (this.catcher) {
          process.removeListener("unhandledRejection", this.catcher);
          this.catcher = false;
          Array.from(this.handlers.values()).forEach(
            (wrapper) => this.logger.unpipe(wrapper)
          );
        }
      }
      /**
       * TODO: add method description
       * @param {Error} err - Error to get information about.
       * @returns {mixed} - TODO: add return description.
       */
      getAllInfo(err) {
        let message = null;
        if (err) {
          message = typeof err === "string" ? err : err.message;
        }
        return {
          error: err,
          // TODO (indexzero): how do we configure this?
          level: "error",
          message: [
            `unhandledRejection: ${message || "(no error message)"}`,
            err && err.stack || "  No stack trace"
          ].join("\n"),
          stack: err && err.stack,
          rejection: true,
          date: (/* @__PURE__ */ new Date()).toString(),
          process: this.getProcessInfo(),
          os: this.getOsInfo(),
          trace: this.getTrace(err)
        };
      }
      /**
       * Gets all relevant process information for the currently running process.
       * @returns {mixed} - TODO: add return description.
       */
      getProcessInfo() {
        return {
          pid: process.pid,
          uid: process.getuid ? process.getuid() : null,
          gid: process.getgid ? process.getgid() : null,
          cwd: process.cwd(),
          execPath: process.execPath,
          version: process.version,
          argv: process.argv,
          memoryUsage: process.memoryUsage()
        };
      }
      /**
       * Gets all relevant OS information for the currently running process.
       * @returns {mixed} - TODO: add return description.
       */
      getOsInfo() {
        return {
          loadavg: os.loadavg(),
          uptime: os.uptime()
        };
      }
      /**
       * Gets a stack trace for the specified error.
       * @param {mixed} err - TODO: add param description.
       * @returns {mixed} - TODO: add return description.
       */
      getTrace(err) {
        const trace = err ? stackTrace.parse(err) : stackTrace.get();
        return trace.map((site) => {
          return {
            column: site.getColumnNumber(),
            file: site.getFileName(),
            function: site.getFunctionName(),
            line: site.getLineNumber(),
            method: site.getMethodName(),
            native: site.isNative()
          };
        });
      }
      /**
       * Helper method to add a transport as an exception handler.
       * @param {Transport} handler - The transport to add as an exception handler.
       * @returns {void}
       */
      _addHandler(handler) {
        if (!this.handlers.has(handler)) {
          handler.handleRejections = true;
          const wrapper = new RejectionStream(handler);
          this.handlers.set(handler, wrapper);
          this.logger.pipe(wrapper);
        }
      }
      /**
       * Logs all relevant information around the `err` and exits the current
       * process.
       * @param {Error} err - Error to handle
       * @returns {mixed} - TODO: add return description.
       * @private
       */
      _unhandledRejection(err) {
        const info = this.getAllInfo(err);
        const handlers = this._getRejectionHandlers();
        let doExit = typeof this.logger.exitOnError === "function" ? this.logger.exitOnError(err) : this.logger.exitOnError;
        let timeout;
        if (!handlers.length && doExit) {
          console.warn("winston: exitOnError cannot be true with no rejection handlers.");
          console.warn("winston: not exiting process.");
          doExit = false;
        }
        function gracefulExit() {
          debug("doExit", doExit);
          debug("process._exiting", process._exiting);
          if (doExit && !process._exiting) {
            if (timeout) {
              clearTimeout(timeout);
            }
            process.exit(1);
          }
        }
        __name(gracefulExit, "gracefulExit");
        if (!handlers || handlers.length === 0) {
          return process.nextTick(gracefulExit);
        }
        asyncForEach(
          handlers,
          (handler, next) => {
            const done = once(next);
            const transport = handler.transport || handler;
            function onDone(event) {
              return () => {
                debug(event);
                done();
              };
            }
            __name(onDone, "onDone");
            transport._ending = true;
            transport.once("finish", onDone("finished"));
            transport.once("error", onDone("error"));
          },
          () => doExit && gracefulExit()
        );
        this.logger.log(info);
        if (doExit) {
          timeout = setTimeout(gracefulExit, 3e3);
        }
      }
      /**
       * Returns the list of transports and exceptionHandlers for this instance.
       * @returns {Array} - List of transports and exceptionHandlers for this
       * instance.
       * @private
       */
      _getRejectionHandlers() {
        return this.logger.transports.filter((wrap) => {
          const transport = wrap.transport || wrap;
          return transport.handleRejections;
        });
      }
    };
  }
});

// node_modules/winston/lib/winston/profiler.js
var require_profiler = __commonJS({
  "node_modules/winston/lib/winston/profiler.js"(exports2, module2) {
    "use strict";
    var Profiler = class {
      static {
        __name(this, "Profiler");
      }
      /**
       * Constructor function for the Profiler instance used by
       * `Logger.prototype.startTimer`. When done is called the timer will finish
       * and log the duration.
       * @param {!Logger} logger - TODO: add param description.
       * @private
       */
      constructor(logger) {
        const Logger = require_logger();
        if (typeof logger !== "object" || Array.isArray(logger) || !(logger instanceof Logger)) {
          throw new Error("Logger is required for profiling");
        } else {
          this.logger = logger;
          this.start = Date.now();
        }
      }
      /**
       * Ends the current timer (i.e. Profiler) instance and logs the `msg` along
       * with the duration since creation.
       * @returns {mixed} - TODO: add return description.
       * @private
       */
      done(...args) {
        if (typeof args[args.length - 1] === "function") {
          console.warn("Callback function no longer supported as of winston@3.0.0");
          args.pop();
        }
        const info = typeof args[args.length - 1] === "object" ? args.pop() : {};
        info.level = info.level || "info";
        info.durationMs = Date.now() - this.start;
        return this.logger.write(info);
      }
    };
    module2.exports = Profiler;
  }
});

// node_modules/winston/lib/winston/logger.js
var require_logger = __commonJS({
  "node_modules/winston/lib/winston/logger.js"(exports2, module2) {
    "use strict";
    var { Stream, Transform } = require_readable();
    var asyncForEach = require_forEach();
    var { LEVEL, SPLAT } = require_triple_beam();
    var isStream = require_is_stream();
    var ExceptionHandler = require_exception_handler();
    var RejectionHandler = require_rejection_handler();
    var LegacyTransportStream = require_legacy();
    var Profiler = require_profiler();
    var { warn } = require_common();
    var config = require_config2();
    var formatRegExp = /%[scdjifoO%]/g;
    var Logger = class extends Transform {
      static {
        __name(this, "Logger");
      }
      /**
       * Constructor function for the Logger object responsible for persisting log
       * messages and metadata to one or more transports.
       * @param {!Object} options - foo
       */
      constructor(options) {
        super({ objectMode: true });
        this.configure(options);
      }
      child(defaultRequestMetadata) {
        const logger = this;
        return Object.create(logger, {
          write: {
            value: /* @__PURE__ */ __name(function(info) {
              const infoClone = Object.assign(
                {},
                defaultRequestMetadata,
                info
              );
              if (info instanceof Error) {
                infoClone.stack = info.stack;
                infoClone.message = info.message;
                infoClone.cause = info.cause;
              }
              logger.write(infoClone);
            }, "value")
          }
        });
      }
      /**
       * This will wholesale reconfigure this instance by:
       * 1. Resetting all transports. Older transports will be removed implicitly.
       * 2. Set all other options including levels, colors, rewriters, filters,
       *    exceptionHandlers, etc.
       * @param {!Object} options - TODO: add param description.
       * @returns {undefined}
       */
      configure({
        silent,
        format,
        defaultMeta,
        levels,
        level = "info",
        exitOnError = true,
        transports,
        colors,
        emitErrs,
        formatters,
        padLevels,
        rewriters,
        stripColors,
        exceptionHandlers,
        rejectionHandlers
      } = {}) {
        if (this.transports.length) {
          this.clear();
        }
        this.silent = silent;
        this.format = format || this.format || require_json()();
        this.defaultMeta = defaultMeta || null;
        this.levels = levels || this.levels || config.npm.levels;
        this.level = level;
        if (this.exceptions) {
          this.exceptions.unhandle();
        }
        if (this.rejections) {
          this.rejections.unhandle();
        }
        this.exceptions = new ExceptionHandler(this);
        this.rejections = new RejectionHandler(this);
        this.profilers = {};
        this.exitOnError = exitOnError;
        if (transports) {
          transports = Array.isArray(transports) ? transports : [transports];
          transports.forEach((transport) => this.add(transport));
        }
        if (colors || emitErrs || formatters || padLevels || rewriters || stripColors) {
          throw new Error(
            [
              "{ colors, emitErrs, formatters, padLevels, rewriters, stripColors } were removed in winston@3.0.0.",
              "Use a custom winston.format(function) instead.",
              "See: https://github.com/winstonjs/winston/tree/master/UPGRADE-3.0.md"
            ].join("\n")
          );
        }
        if (exceptionHandlers) {
          this.exceptions.handle(exceptionHandlers);
        }
        if (rejectionHandlers) {
          this.rejections.handle(rejectionHandlers);
        }
      }
      /* eslint-disable valid-jsdoc */
      /**
       * Helper method to get the highest logging level associated with a logger
       *
       * @returns { number | null } - The highest configured logging level, null
       * for invalid configuration
       */
      getHighestLogLevel() {
        const configuredLevelValue = getLevelValue(this.levels, this.level);
        if (!this.transports || this.transports.length === 0) {
          return configuredLevelValue;
        }
        return this.transports.reduce((max, transport) => {
          const levelValue = getLevelValue(this.levels, transport.level);
          return levelValue !== null && levelValue > max ? levelValue : max;
        }, configuredLevelValue);
      }
      isLevelEnabled(level) {
        const givenLevelValue = getLevelValue(this.levels, level);
        if (givenLevelValue === null) {
          return false;
        }
        const configuredLevelValue = getLevelValue(this.levels, this.level);
        if (configuredLevelValue === null) {
          return false;
        }
        if (!this.transports || this.transports.length === 0) {
          return configuredLevelValue >= givenLevelValue;
        }
        const index = this.transports.findIndex((transport) => {
          let transportLevelValue = getLevelValue(this.levels, transport.level);
          if (transportLevelValue === null) {
            transportLevelValue = configuredLevelValue;
          }
          return transportLevelValue >= givenLevelValue;
        });
        return index !== -1;
      }
      /* eslint-disable valid-jsdoc */
      /**
       * Ensure backwards compatibility with a `log` method
       * @param {mixed} level - Level the log message is written at.
       * @param {mixed} msg - TODO: add param description.
       * @param {mixed} meta - TODO: add param description.
       * @returns {Logger} - TODO: add return description.
       *
       * @example
       *    // Supports the existing API:
       *    logger.log('info', 'Hello world', { custom: true });
       *    logger.log('info', new Error('Yo, it\'s on fire'));
       *
       *    // Requires winston.format.splat()
       *    logger.log('info', '%s %d%%', 'A string', 50, { thisIsMeta: true });
       *
       *    // And the new API with a single JSON literal:
       *    logger.log({ level: 'info', message: 'Hello world', custom: true });
       *    logger.log({ level: 'info', message: new Error('Yo, it\'s on fire') });
       *
       *    // Also requires winston.format.splat()
       *    logger.log({
       *      level: 'info',
       *      message: '%s %d%%',
       *      [SPLAT]: ['A string', 50],
       *      meta: { thisIsMeta: true }
       *    });
       *
       */
      /* eslint-enable valid-jsdoc */
      log(level, msg, ...splat) {
        if (arguments.length === 1) {
          level[LEVEL] = level.level;
          this._addDefaultMeta(level);
          this.write(level);
          return this;
        }
        if (arguments.length === 2) {
          if (msg && typeof msg === "object") {
            msg[LEVEL] = msg.level = level;
            this._addDefaultMeta(msg);
            this.write(msg);
            return this;
          }
          msg = { [LEVEL]: level, level, message: msg };
          this._addDefaultMeta(msg);
          this.write(msg);
          return this;
        }
        const [meta] = splat;
        if (typeof meta === "object" && meta !== null) {
          const tokens = msg && msg.match && msg.match(formatRegExp);
          if (!tokens) {
            const info = Object.assign({}, this.defaultMeta, meta, {
              [LEVEL]: level,
              [SPLAT]: splat,
              level,
              message: msg
            });
            if (meta.message) info.message = `${info.message} ${meta.message}`;
            if (meta.stack) info.stack = meta.stack;
            if (meta.cause) info.cause = meta.cause;
            this.write(info);
            return this;
          }
        }
        this.write(Object.assign({}, this.defaultMeta, {
          [LEVEL]: level,
          [SPLAT]: splat,
          level,
          message: msg
        }));
        return this;
      }
      /**
       * Pushes data so that it can be picked up by all of our pipe targets.
       * @param {mixed} info - TODO: add param description.
       * @param {mixed} enc - TODO: add param description.
       * @param {mixed} callback - Continues stream processing.
       * @returns {undefined}
       * @private
       */
      _transform(info, enc, callback) {
        if (this.silent) {
          return callback();
        }
        if (!info[LEVEL]) {
          info[LEVEL] = info.level;
        }
        if (!this.levels[info[LEVEL]] && this.levels[info[LEVEL]] !== 0) {
          console.error("[winston] Unknown logger level: %s", info[LEVEL]);
        }
        if (!this._readableState.pipes) {
          console.error(
            "[winston] Attempt to write logs with no transports, which can increase memory usage: %j",
            info
          );
        }
        try {
          this.push(this.format.transform(info, this.format.options));
        } finally {
          this._writableState.sync = false;
          callback();
        }
      }
      /**
       * Delays the 'finish' event until all transport pipe targets have
       * also emitted 'finish' or are already finished.
       * @param {mixed} callback - Continues stream processing.
       */
      _final(callback) {
        const transports = this.transports.slice();
        asyncForEach(
          transports,
          (transport, next) => {
            if (!transport || transport.finished) return setImmediate(next);
            transport.once("finish", next);
            transport.end();
          },
          callback
        );
      }
      /**
       * Adds the transport to this logger instance by piping to it.
       * @param {mixed} transport - TODO: add param description.
       * @returns {Logger} - TODO: add return description.
       */
      add(transport) {
        const target = !isStream(transport) || transport.log.length > 2 ? new LegacyTransportStream({ transport }) : transport;
        if (!target._writableState || !target._writableState.objectMode) {
          throw new Error(
            "Transports must WritableStreams in objectMode. Set { objectMode: true }."
          );
        }
        this._onEvent("error", target);
        this._onEvent("warn", target);
        this.pipe(target);
        if (transport.handleExceptions) {
          this.exceptions.handle();
        }
        if (transport.handleRejections) {
          this.rejections.handle();
        }
        return this;
      }
      /**
       * Removes the transport from this logger instance by unpiping from it.
       * @param {mixed} transport - TODO: add param description.
       * @returns {Logger} - TODO: add return description.
       */
      remove(transport) {
        if (!transport) return this;
        let target = transport;
        if (!isStream(transport) || transport.log.length > 2) {
          target = this.transports.filter(
            (match) => match.transport === transport
          )[0];
        }
        if (target) {
          this.unpipe(target);
        }
        return this;
      }
      /**
       * Removes all transports from this logger instance.
       * @returns {Logger} - TODO: add return description.
       */
      clear() {
        this.unpipe();
        return this;
      }
      /**
       * Cleans up resources (streams, event listeners) for all transports
       * associated with this instance (if necessary).
       * @returns {Logger} - TODO: add return description.
       */
      close() {
        this.exceptions.unhandle();
        this.rejections.unhandle();
        this.clear();
        this.emit("close");
        return this;
      }
      /**
       * Sets the `target` levels specified on this instance.
       * @param {Object} Target levels to use on this instance.
       */
      setLevels() {
        warn.deprecated("setLevels");
      }
      /**
       * Queries the all transports for this instance with the specified `options`.
       * This will aggregate each transport's results into one object containing
       * a property per transport.
       * @param {Object} options - Query options for this instance.
       * @param {function} callback - Continuation to respond to when complete.
       */
      query(options, callback) {
        if (typeof options === "function") {
          callback = options;
          options = {};
        }
        options = options || {};
        const results = {};
        const queryObject = Object.assign({}, options.query || {});
        function queryTransport(transport, next) {
          if (options.query && typeof transport.formatQuery === "function") {
            options.query = transport.formatQuery(queryObject);
          }
          transport.query(options, (err, res) => {
            if (err) {
              return next(err);
            }
            if (typeof transport.formatResults === "function") {
              res = transport.formatResults(res, options.format);
            }
            next(null, res);
          });
        }
        __name(queryTransport, "queryTransport");
        function addResults(transport, next) {
          queryTransport(transport, (err, result) => {
            if (next) {
              result = err || result;
              if (result) {
                results[transport.name] = result;
              }
              next();
            }
            next = null;
          });
        }
        __name(addResults, "addResults");
        asyncForEach(
          this.transports.filter((transport) => !!transport.query),
          addResults,
          () => callback(null, results)
        );
      }
      /**
       * Returns a log stream for all transports. Options object is optional.
       * @param{Object} options={} - Stream options for this instance.
       * @returns {Stream} - TODO: add return description.
       */
      stream(options = {}) {
        const out = new Stream();
        const streams = [];
        out._streams = streams;
        out.destroy = () => {
          let i = streams.length;
          while (i--) {
            streams[i].destroy();
          }
        };
        this.transports.filter((transport) => !!transport.stream).forEach((transport) => {
          const str = transport.stream(options);
          if (!str) {
            return;
          }
          streams.push(str);
          str.on("log", (log) => {
            log.transport = log.transport || [];
            log.transport.push(transport.name);
            out.emit("log", log);
          });
          str.on("error", (err) => {
            err.transport = err.transport || [];
            err.transport.push(transport.name);
            out.emit("error", err);
          });
        });
        return out;
      }
      /**
       * Returns an object corresponding to a specific timing. When done is called
       * the timer will finish and log the duration. e.g.:
       * @returns {Profile} - TODO: add return description.
       * @example
       *    const timer = winston.startTimer()
       *    setTimeout(() => {
       *      timer.done({
       *        message: 'Logging message'
       *      });
       *    }, 1000);
       */
      startTimer() {
        return new Profiler(this);
      }
      /**
       * Tracks the time inbetween subsequent calls to this method with the same
       * `id` parameter. The second call to this method will log the difference in
       * milliseconds along with the message.
       * @param {string} id Unique id of the profiler
       * @returns {Logger} - TODO: add return description.
       */
      profile(id, ...args) {
        const time = Date.now();
        if (this.profilers[id]) {
          const timeEnd = this.profilers[id];
          delete this.profilers[id];
          if (typeof args[args.length - 2] === "function") {
            console.warn(
              "Callback function no longer supported as of winston@3.0.0"
            );
            args.pop();
          }
          const info = typeof args[args.length - 1] === "object" ? args.pop() : {};
          info.level = info.level || "info";
          info.durationMs = time - timeEnd;
          info.message = info.message || id;
          return this.write(info);
        }
        this.profilers[id] = time;
        return this;
      }
      /**
       * Backwards compatibility to `exceptions.handle` in winston < 3.0.0.
       * @returns {undefined}
       * @deprecated
       */
      handleExceptions(...args) {
        console.warn(
          "Deprecated: .handleExceptions() will be removed in winston@4. Use .exceptions.handle()"
        );
        this.exceptions.handle(...args);
      }
      /**
       * Backwards compatibility to `exceptions.handle` in winston < 3.0.0.
       * @returns {undefined}
       * @deprecated
       */
      unhandleExceptions(...args) {
        console.warn(
          "Deprecated: .unhandleExceptions() will be removed in winston@4. Use .exceptions.unhandle()"
        );
        this.exceptions.unhandle(...args);
      }
      /**
       * Throw a more meaningful deprecation notice
       * @throws {Error} - TODO: add throws description.
       */
      cli() {
        throw new Error(
          [
            "Logger.cli() was removed in winston@3.0.0",
            "Use a custom winston.formats.cli() instead.",
            "See: https://github.com/winstonjs/winston/tree/master/UPGRADE-3.0.md"
          ].join("\n")
        );
      }
      /**
       * Bubbles the `event` that occured on the specified `transport` up
       * from this instance.
       * @param {string} event - The event that occured
       * @param {Object} transport - Transport on which the event occured
       * @private
       */
      _onEvent(event, transport) {
        function transportEvent(err) {
          if (event === "error" && !this.transports.includes(transport)) {
            this.add(transport);
          }
          this.emit(event, err, transport);
        }
        __name(transportEvent, "transportEvent");
        if (!transport["__winston" + event]) {
          transport["__winston" + event] = transportEvent.bind(this);
          transport.on(event, transport["__winston" + event]);
        }
      }
      _addDefaultMeta(msg) {
        if (this.defaultMeta) {
          Object.assign(msg, this.defaultMeta);
        }
      }
    };
    function getLevelValue(levels, level) {
      const value = levels[level];
      if (!value && value !== 0) {
        return null;
      }
      return value;
    }
    __name(getLevelValue, "getLevelValue");
    Object.defineProperty(Logger.prototype, "transports", {
      configurable: false,
      enumerable: true,
      get() {
        const { pipes } = this._readableState;
        return !Array.isArray(pipes) ? [pipes].filter(Boolean) : pipes;
      }
    });
    module2.exports = Logger;
  }
});

// node_modules/winston/lib/winston/create-logger.js
var require_create_logger = __commonJS({
  "node_modules/winston/lib/winston/create-logger.js"(exports2, module2) {
    "use strict";
    var { LEVEL } = require_triple_beam();
    var config = require_config2();
    var Logger = require_logger();
    var debug = require_node2()("winston:create-logger");
    function isLevelEnabledFunctionName(level) {
      return "is" + level.charAt(0).toUpperCase() + level.slice(1) + "Enabled";
    }
    __name(isLevelEnabledFunctionName, "isLevelEnabledFunctionName");
    module2.exports = function(opts = {}) {
      opts.levels = opts.levels || config.npm.levels;
      class DerivedLogger extends Logger {
        static {
          __name(this, "DerivedLogger");
        }
        /**
         * Create a new class derived logger for which the levels can be attached to
         * the prototype of. This is a V8 optimization that is well know to increase
         * performance of prototype functions.
         * @param {!Object} options - Options for the created logger.
         */
        constructor(options) {
          super(options);
        }
      }
      const logger = new DerivedLogger(opts);
      Object.keys(opts.levels).forEach(function(level) {
        debug('Define prototype method for "%s"', level);
        if (level === "log") {
          console.warn('Level "log" not defined: conflicts with the method "log". Use a different level name.');
          return;
        }
        DerivedLogger.prototype[level] = function(...args) {
          const self2 = this || logger;
          if (args.length === 1) {
            const [msg] = args;
            const info = msg && msg.message && msg || { message: msg };
            info.level = info[LEVEL] = level;
            self2._addDefaultMeta(info);
            self2.write(info);
            return this || logger;
          }
          if (args.length === 0) {
            self2.log(level, "");
            return self2;
          }
          return self2.log(level, ...args);
        };
        DerivedLogger.prototype[isLevelEnabledFunctionName(level)] = function() {
          return (this || logger).isLevelEnabled(level);
        };
      });
      return logger;
    };
  }
});

// node_modules/winston/lib/winston/container.js
var require_container2 = __commonJS({
  "node_modules/winston/lib/winston/container.js"(exports2, module2) {
    "use strict";
    var createLogger = require_create_logger();
    module2.exports = class Container {
      static {
        __name(this, "Container");
      }
      /**
       * Constructor function for the Container object responsible for managing a
       * set of `winston.Logger` instances based on string ids.
       * @param {!Object} [options={}] - Default pass-thru options for Loggers.
       */
      constructor(options = {}) {
        this.loggers = /* @__PURE__ */ new Map();
        this.options = options;
      }
      /**
       * Retrieves a `winston.Logger` instance for the specified `id`. If an
       * instance does not exist, one is created.
       * @param {!string} id - The id of the Logger to get.
       * @param {?Object} [options] - Options for the Logger instance.
       * @returns {Logger} - A configured Logger instance with a specified id.
       */
      add(id, options) {
        if (!this.loggers.has(id)) {
          options = Object.assign({}, options || this.options);
          const existing = options.transports || this.options.transports;
          if (existing) {
            options.transports = Array.isArray(existing) ? existing.slice() : [existing];
          } else {
            options.transports = [];
          }
          const logger = createLogger(options);
          logger.on("close", () => this._delete(id));
          this.loggers.set(id, logger);
        }
        return this.loggers.get(id);
      }
      /**
       * Retreives a `winston.Logger` instance for the specified `id`. If
       * an instance does not exist, one is created.
       * @param {!string} id - The id of the Logger to get.
       * @param {?Object} [options] - Options for the Logger instance.
       * @returns {Logger} - A configured Logger instance with a specified id.
       */
      get(id, options) {
        return this.add(id, options);
      }
      /**
       * Check if the container has a logger with the id.
       * @param {?string} id - The id of the Logger instance to find.
       * @returns {boolean} - Boolean value indicating if this instance has a
       * logger with the specified `id`.
       */
      has(id) {
        return !!this.loggers.has(id);
      }
      /**
       * Closes a `Logger` instance with the specified `id` if it exists.
       * If no `id` is supplied then all Loggers are closed.
       * @param {?string} id - The id of the Logger instance to close.
       * @returns {undefined}
       */
      close(id) {
        if (id) {
          return this._removeLogger(id);
        }
        this.loggers.forEach((val, key) => this._removeLogger(key));
      }
      /**
       * Remove a logger based on the id.
       * @param {!string} id - The id of the logger to remove.
       * @returns {undefined}
       * @private
       */
      _removeLogger(id) {
        if (!this.loggers.has(id)) {
          return;
        }
        const logger = this.loggers.get(id);
        logger.close();
        this._delete(id);
      }
      /**
       * Deletes a `Logger` instance with the specified `id`.
       * @param {!string} id - The id of the Logger instance to delete from
       * container.
       * @returns {undefined}
       * @private
       */
      _delete(id) {
        this.loggers.delete(id);
      }
    };
  }
});

// node_modules/winston/lib/winston.js
var require_winston = __commonJS({
  "node_modules/winston/lib/winston.js"(exports2) {
    "use strict";
    var logform = require_logform();
    var { warn } = require_common();
    exports2.version = require_package().version;
    exports2.transports = require_transports();
    exports2.config = require_config2();
    exports2.addColors = logform.levels;
    exports2.format = logform.format;
    exports2.createLogger = require_create_logger();
    exports2.Logger = require_logger();
    exports2.ExceptionHandler = require_exception_handler();
    exports2.RejectionHandler = require_rejection_handler();
    exports2.Container = require_container2();
    exports2.Transport = require_winston_transport();
    exports2.loggers = new exports2.Container();
    var defaultLogger = exports2.createLogger();
    Object.keys(exports2.config.npm.levels).concat([
      "log",
      "query",
      "stream",
      "add",
      "remove",
      "clear",
      "profile",
      "startTimer",
      "handleExceptions",
      "unhandleExceptions",
      "handleRejections",
      "unhandleRejections",
      "configure",
      "child"
    ]).forEach(
      (method) => exports2[method] = (...args) => defaultLogger[method](...args)
    );
    Object.defineProperty(exports2, "level", {
      get() {
        return defaultLogger.level;
      },
      set(val) {
        defaultLogger.level = val;
      }
    });
    Object.defineProperty(exports2, "exceptions", {
      get() {
        return defaultLogger.exceptions;
      }
    });
    Object.defineProperty(exports2, "rejections", {
      get() {
        return defaultLogger.rejections;
      }
    });
    ["exitOnError"].forEach((prop) => {
      Object.defineProperty(exports2, prop, {
        get() {
          return defaultLogger[prop];
        },
        set(val) {
          defaultLogger[prop] = val;
        }
      });
    });
    Object.defineProperty(exports2, "default", {
      get() {
        return {
          exceptionHandlers: defaultLogger.exceptionHandlers,
          rejectionHandlers: defaultLogger.rejectionHandlers,
          transports: defaultLogger.transports
        };
      }
    });
    warn.deprecated(exports2, "setLevels");
    warn.forFunctions(exports2, "useFormat", ["cli"]);
    warn.forProperties(exports2, "useFormat", ["padLevels", "stripColors"]);
    warn.forFunctions(exports2, "deprecated", [
      "addRewriter",
      "addFilter",
      "clone",
      "extend"
    ]);
    warn.forProperties(exports2, "deprecated", ["emitErrs", "levelLength"]);
  }
});

// node_modules/fast-diff/diff.js
var require_diff = __commonJS({
  "node_modules/fast-diff/diff.js"(exports2, module2) {
    var DIFF_DELETE = -1;
    var DIFF_INSERT = 1;
    var DIFF_EQUAL = 0;
    function diff_main(text1, text2, cursor_pos, cleanup, _fix_unicode) {
      if (text1 === text2) {
        if (text1) {
          return [[DIFF_EQUAL, text1]];
        }
        return [];
      }
      if (cursor_pos != null) {
        var editdiff = find_cursor_edit_diff(text1, text2, cursor_pos);
        if (editdiff) {
          return editdiff;
        }
      }
      var commonlength = diff_commonPrefix(text1, text2);
      var commonprefix = text1.substring(0, commonlength);
      text1 = text1.substring(commonlength);
      text2 = text2.substring(commonlength);
      commonlength = diff_commonSuffix(text1, text2);
      var commonsuffix = text1.substring(text1.length - commonlength);
      text1 = text1.substring(0, text1.length - commonlength);
      text2 = text2.substring(0, text2.length - commonlength);
      var diffs = diff_compute_(text1, text2);
      if (commonprefix) {
        diffs.unshift([DIFF_EQUAL, commonprefix]);
      }
      if (commonsuffix) {
        diffs.push([DIFF_EQUAL, commonsuffix]);
      }
      diff_cleanupMerge(diffs, _fix_unicode);
      if (cleanup) {
        diff_cleanupSemantic(diffs);
      }
      return diffs;
    }
    __name(diff_main, "diff_main");
    function diff_compute_(text1, text2) {
      var diffs;
      if (!text1) {
        return [[DIFF_INSERT, text2]];
      }
      if (!text2) {
        return [[DIFF_DELETE, text1]];
      }
      var longtext = text1.length > text2.length ? text1 : text2;
      var shorttext = text1.length > text2.length ? text2 : text1;
      var i = longtext.indexOf(shorttext);
      if (i !== -1) {
        diffs = [
          [DIFF_INSERT, longtext.substring(0, i)],
          [DIFF_EQUAL, shorttext],
          [DIFF_INSERT, longtext.substring(i + shorttext.length)]
        ];
        if (text1.length > text2.length) {
          diffs[0][0] = diffs[2][0] = DIFF_DELETE;
        }
        return diffs;
      }
      if (shorttext.length === 1) {
        return [
          [DIFF_DELETE, text1],
          [DIFF_INSERT, text2]
        ];
      }
      var hm = diff_halfMatch_(text1, text2);
      if (hm) {
        var text1_a = hm[0];
        var text1_b = hm[1];
        var text2_a = hm[2];
        var text2_b = hm[3];
        var mid_common = hm[4];
        var diffs_a = diff_main(text1_a, text2_a);
        var diffs_b = diff_main(text1_b, text2_b);
        return diffs_a.concat([[DIFF_EQUAL, mid_common]], diffs_b);
      }
      return diff_bisect_(text1, text2);
    }
    __name(diff_compute_, "diff_compute_");
    function diff_bisect_(text1, text2) {
      var text1_length = text1.length;
      var text2_length = text2.length;
      var max_d = Math.ceil((text1_length + text2_length) / 2);
      var v_offset = max_d;
      var v_length = 2 * max_d;
      var v1 = new Array(v_length);
      var v2 = new Array(v_length);
      for (var x = 0; x < v_length; x++) {
        v1[x] = -1;
        v2[x] = -1;
      }
      v1[v_offset + 1] = 0;
      v2[v_offset + 1] = 0;
      var delta = text1_length - text2_length;
      var front = delta % 2 !== 0;
      var k1start = 0;
      var k1end = 0;
      var k2start = 0;
      var k2end = 0;
      for (var d = 0; d < max_d; d++) {
        for (var k1 = -d + k1start; k1 <= d - k1end; k1 += 2) {
          var k1_offset = v_offset + k1;
          var x1;
          if (k1 === -d || k1 !== d && v1[k1_offset - 1] < v1[k1_offset + 1]) {
            x1 = v1[k1_offset + 1];
          } else {
            x1 = v1[k1_offset - 1] + 1;
          }
          var y1 = x1 - k1;
          while (x1 < text1_length && y1 < text2_length && text1.charAt(x1) === text2.charAt(y1)) {
            x1++;
            y1++;
          }
          v1[k1_offset] = x1;
          if (x1 > text1_length) {
            k1end += 2;
          } else if (y1 > text2_length) {
            k1start += 2;
          } else if (front) {
            var k2_offset = v_offset + delta - k1;
            if (k2_offset >= 0 && k2_offset < v_length && v2[k2_offset] !== -1) {
              var x2 = text1_length - v2[k2_offset];
              if (x1 >= x2) {
                return diff_bisectSplit_(text1, text2, x1, y1);
              }
            }
          }
        }
        for (var k2 = -d + k2start; k2 <= d - k2end; k2 += 2) {
          var k2_offset = v_offset + k2;
          var x2;
          if (k2 === -d || k2 !== d && v2[k2_offset - 1] < v2[k2_offset + 1]) {
            x2 = v2[k2_offset + 1];
          } else {
            x2 = v2[k2_offset - 1] + 1;
          }
          var y2 = x2 - k2;
          while (x2 < text1_length && y2 < text2_length && text1.charAt(text1_length - x2 - 1) === text2.charAt(text2_length - y2 - 1)) {
            x2++;
            y2++;
          }
          v2[k2_offset] = x2;
          if (x2 > text1_length) {
            k2end += 2;
          } else if (y2 > text2_length) {
            k2start += 2;
          } else if (!front) {
            var k1_offset = v_offset + delta - k2;
            if (k1_offset >= 0 && k1_offset < v_length && v1[k1_offset] !== -1) {
              var x1 = v1[k1_offset];
              var y1 = v_offset + x1 - k1_offset;
              x2 = text1_length - x2;
              if (x1 >= x2) {
                return diff_bisectSplit_(text1, text2, x1, y1);
              }
            }
          }
        }
      }
      return [
        [DIFF_DELETE, text1],
        [DIFF_INSERT, text2]
      ];
    }
    __name(diff_bisect_, "diff_bisect_");
    function diff_bisectSplit_(text1, text2, x, y) {
      var text1a = text1.substring(0, x);
      var text2a = text2.substring(0, y);
      var text1b = text1.substring(x);
      var text2b = text2.substring(y);
      var diffs = diff_main(text1a, text2a);
      var diffsb = diff_main(text1b, text2b);
      return diffs.concat(diffsb);
    }
    __name(diff_bisectSplit_, "diff_bisectSplit_");
    function diff_commonPrefix(text1, text2) {
      if (!text1 || !text2 || text1.charAt(0) !== text2.charAt(0)) {
        return 0;
      }
      var pointermin = 0;
      var pointermax = Math.min(text1.length, text2.length);
      var pointermid = pointermax;
      var pointerstart = 0;
      while (pointermin < pointermid) {
        if (text1.substring(pointerstart, pointermid) == text2.substring(pointerstart, pointermid)) {
          pointermin = pointermid;
          pointerstart = pointermin;
        } else {
          pointermax = pointermid;
        }
        pointermid = Math.floor((pointermax - pointermin) / 2 + pointermin);
      }
      if (is_surrogate_pair_start(text1.charCodeAt(pointermid - 1))) {
        pointermid--;
      }
      return pointermid;
    }
    __name(diff_commonPrefix, "diff_commonPrefix");
    function diff_commonOverlap_(text1, text2) {
      var text1_length = text1.length;
      var text2_length = text2.length;
      if (text1_length == 0 || text2_length == 0) {
        return 0;
      }
      if (text1_length > text2_length) {
        text1 = text1.substring(text1_length - text2_length);
      } else if (text1_length < text2_length) {
        text2 = text2.substring(0, text1_length);
      }
      var text_length = Math.min(text1_length, text2_length);
      if (text1 == text2) {
        return text_length;
      }
      var best = 0;
      var length = 1;
      while (true) {
        var pattern = text1.substring(text_length - length);
        var found = text2.indexOf(pattern);
        if (found == -1) {
          return best;
        }
        length += found;
        if (found == 0 || text1.substring(text_length - length) == text2.substring(0, length)) {
          best = length;
          length++;
        }
      }
    }
    __name(diff_commonOverlap_, "diff_commonOverlap_");
    function diff_commonSuffix(text1, text2) {
      if (!text1 || !text2 || text1.slice(-1) !== text2.slice(-1)) {
        return 0;
      }
      var pointermin = 0;
      var pointermax = Math.min(text1.length, text2.length);
      var pointermid = pointermax;
      var pointerend = 0;
      while (pointermin < pointermid) {
        if (text1.substring(text1.length - pointermid, text1.length - pointerend) == text2.substring(text2.length - pointermid, text2.length - pointerend)) {
          pointermin = pointermid;
          pointerend = pointermin;
        } else {
          pointermax = pointermid;
        }
        pointermid = Math.floor((pointermax - pointermin) / 2 + pointermin);
      }
      if (is_surrogate_pair_end(text1.charCodeAt(text1.length - pointermid))) {
        pointermid--;
      }
      return pointermid;
    }
    __name(diff_commonSuffix, "diff_commonSuffix");
    function diff_halfMatch_(text1, text2) {
      var longtext = text1.length > text2.length ? text1 : text2;
      var shorttext = text1.length > text2.length ? text2 : text1;
      if (longtext.length < 4 || shorttext.length * 2 < longtext.length) {
        return null;
      }
      function diff_halfMatchI_(longtext2, shorttext2, i) {
        var seed = longtext2.substring(i, i + Math.floor(longtext2.length / 4));
        var j = -1;
        var best_common = "";
        var best_longtext_a, best_longtext_b, best_shorttext_a, best_shorttext_b;
        while ((j = shorttext2.indexOf(seed, j + 1)) !== -1) {
          var prefixLength = diff_commonPrefix(
            longtext2.substring(i),
            shorttext2.substring(j)
          );
          var suffixLength = diff_commonSuffix(
            longtext2.substring(0, i),
            shorttext2.substring(0, j)
          );
          if (best_common.length < suffixLength + prefixLength) {
            best_common = shorttext2.substring(j - suffixLength, j) + shorttext2.substring(j, j + prefixLength);
            best_longtext_a = longtext2.substring(0, i - suffixLength);
            best_longtext_b = longtext2.substring(i + prefixLength);
            best_shorttext_a = shorttext2.substring(0, j - suffixLength);
            best_shorttext_b = shorttext2.substring(j + prefixLength);
          }
        }
        if (best_common.length * 2 >= longtext2.length) {
          return [
            best_longtext_a,
            best_longtext_b,
            best_shorttext_a,
            best_shorttext_b,
            best_common
          ];
        } else {
          return null;
        }
      }
      __name(diff_halfMatchI_, "diff_halfMatchI_");
      var hm1 = diff_halfMatchI_(
        longtext,
        shorttext,
        Math.ceil(longtext.length / 4)
      );
      var hm2 = diff_halfMatchI_(
        longtext,
        shorttext,
        Math.ceil(longtext.length / 2)
      );
      var hm;
      if (!hm1 && !hm2) {
        return null;
      } else if (!hm2) {
        hm = hm1;
      } else if (!hm1) {
        hm = hm2;
      } else {
        hm = hm1[4].length > hm2[4].length ? hm1 : hm2;
      }
      var text1_a, text1_b, text2_a, text2_b;
      if (text1.length > text2.length) {
        text1_a = hm[0];
        text1_b = hm[1];
        text2_a = hm[2];
        text2_b = hm[3];
      } else {
        text2_a = hm[0];
        text2_b = hm[1];
        text1_a = hm[2];
        text1_b = hm[3];
      }
      var mid_common = hm[4];
      return [text1_a, text1_b, text2_a, text2_b, mid_common];
    }
    __name(diff_halfMatch_, "diff_halfMatch_");
    function diff_cleanupSemantic(diffs) {
      var changes = false;
      var equalities = [];
      var equalitiesLength = 0;
      var lastequality = null;
      var pointer = 0;
      var length_insertions1 = 0;
      var length_deletions1 = 0;
      var length_insertions2 = 0;
      var length_deletions2 = 0;
      while (pointer < diffs.length) {
        if (diffs[pointer][0] == DIFF_EQUAL) {
          equalities[equalitiesLength++] = pointer;
          length_insertions1 = length_insertions2;
          length_deletions1 = length_deletions2;
          length_insertions2 = 0;
          length_deletions2 = 0;
          lastequality = diffs[pointer][1];
        } else {
          if (diffs[pointer][0] == DIFF_INSERT) {
            length_insertions2 += diffs[pointer][1].length;
          } else {
            length_deletions2 += diffs[pointer][1].length;
          }
          if (lastequality && lastequality.length <= Math.max(length_insertions1, length_deletions1) && lastequality.length <= Math.max(length_insertions2, length_deletions2)) {
            diffs.splice(equalities[equalitiesLength - 1], 0, [
              DIFF_DELETE,
              lastequality
            ]);
            diffs[equalities[equalitiesLength - 1] + 1][0] = DIFF_INSERT;
            equalitiesLength--;
            equalitiesLength--;
            pointer = equalitiesLength > 0 ? equalities[equalitiesLength - 1] : -1;
            length_insertions1 = 0;
            length_deletions1 = 0;
            length_insertions2 = 0;
            length_deletions2 = 0;
            lastequality = null;
            changes = true;
          }
        }
        pointer++;
      }
      if (changes) {
        diff_cleanupMerge(diffs);
      }
      diff_cleanupSemanticLossless(diffs);
      pointer = 1;
      while (pointer < diffs.length) {
        if (diffs[pointer - 1][0] == DIFF_DELETE && diffs[pointer][0] == DIFF_INSERT) {
          var deletion = diffs[pointer - 1][1];
          var insertion = diffs[pointer][1];
          var overlap_length1 = diff_commonOverlap_(deletion, insertion);
          var overlap_length2 = diff_commonOverlap_(insertion, deletion);
          if (overlap_length1 >= overlap_length2) {
            if (overlap_length1 >= deletion.length / 2 || overlap_length1 >= insertion.length / 2) {
              diffs.splice(pointer, 0, [
                DIFF_EQUAL,
                insertion.substring(0, overlap_length1)
              ]);
              diffs[pointer - 1][1] = deletion.substring(
                0,
                deletion.length - overlap_length1
              );
              diffs[pointer + 1][1] = insertion.substring(overlap_length1);
              pointer++;
            }
          } else {
            if (overlap_length2 >= deletion.length / 2 || overlap_length2 >= insertion.length / 2) {
              diffs.splice(pointer, 0, [
                DIFF_EQUAL,
                deletion.substring(0, overlap_length2)
              ]);
              diffs[pointer - 1][0] = DIFF_INSERT;
              diffs[pointer - 1][1] = insertion.substring(
                0,
                insertion.length - overlap_length2
              );
              diffs[pointer + 1][0] = DIFF_DELETE;
              diffs[pointer + 1][1] = deletion.substring(overlap_length2);
              pointer++;
            }
          }
          pointer++;
        }
        pointer++;
      }
    }
    __name(diff_cleanupSemantic, "diff_cleanupSemantic");
    var nonAlphaNumericRegex_ = /[^a-zA-Z0-9]/;
    var whitespaceRegex_ = /\s/;
    var linebreakRegex_ = /[\r\n]/;
    var blanklineEndRegex_ = /\n\r?\n$/;
    var blanklineStartRegex_ = /^\r?\n\r?\n/;
    function diff_cleanupSemanticLossless(diffs) {
      function diff_cleanupSemanticScore_(one, two) {
        if (!one || !two) {
          return 6;
        }
        var char1 = one.charAt(one.length - 1);
        var char2 = two.charAt(0);
        var nonAlphaNumeric1 = char1.match(nonAlphaNumericRegex_);
        var nonAlphaNumeric2 = char2.match(nonAlphaNumericRegex_);
        var whitespace1 = nonAlphaNumeric1 && char1.match(whitespaceRegex_);
        var whitespace2 = nonAlphaNumeric2 && char2.match(whitespaceRegex_);
        var lineBreak1 = whitespace1 && char1.match(linebreakRegex_);
        var lineBreak2 = whitespace2 && char2.match(linebreakRegex_);
        var blankLine1 = lineBreak1 && one.match(blanklineEndRegex_);
        var blankLine2 = lineBreak2 && two.match(blanklineStartRegex_);
        if (blankLine1 || blankLine2) {
          return 5;
        } else if (lineBreak1 || lineBreak2) {
          return 4;
        } else if (nonAlphaNumeric1 && !whitespace1 && whitespace2) {
          return 3;
        } else if (whitespace1 || whitespace2) {
          return 2;
        } else if (nonAlphaNumeric1 || nonAlphaNumeric2) {
          return 1;
        }
        return 0;
      }
      __name(diff_cleanupSemanticScore_, "diff_cleanupSemanticScore_");
      var pointer = 1;
      while (pointer < diffs.length - 1) {
        if (diffs[pointer - 1][0] == DIFF_EQUAL && diffs[pointer + 1][0] == DIFF_EQUAL) {
          var equality1 = diffs[pointer - 1][1];
          var edit = diffs[pointer][1];
          var equality2 = diffs[pointer + 1][1];
          var commonOffset = diff_commonSuffix(equality1, edit);
          if (commonOffset) {
            var commonString = edit.substring(edit.length - commonOffset);
            equality1 = equality1.substring(0, equality1.length - commonOffset);
            edit = commonString + edit.substring(0, edit.length - commonOffset);
            equality2 = commonString + equality2;
          }
          var bestEquality1 = equality1;
          var bestEdit = edit;
          var bestEquality2 = equality2;
          var bestScore = diff_cleanupSemanticScore_(equality1, edit) + diff_cleanupSemanticScore_(edit, equality2);
          while (edit.charAt(0) === equality2.charAt(0)) {
            equality1 += edit.charAt(0);
            edit = edit.substring(1) + equality2.charAt(0);
            equality2 = equality2.substring(1);
            var score = diff_cleanupSemanticScore_(equality1, edit) + diff_cleanupSemanticScore_(edit, equality2);
            if (score >= bestScore) {
              bestScore = score;
              bestEquality1 = equality1;
              bestEdit = edit;
              bestEquality2 = equality2;
            }
          }
          if (diffs[pointer - 1][1] != bestEquality1) {
            if (bestEquality1) {
              diffs[pointer - 1][1] = bestEquality1;
            } else {
              diffs.splice(pointer - 1, 1);
              pointer--;
            }
            diffs[pointer][1] = bestEdit;
            if (bestEquality2) {
              diffs[pointer + 1][1] = bestEquality2;
            } else {
              diffs.splice(pointer + 1, 1);
              pointer--;
            }
          }
        }
        pointer++;
      }
    }
    __name(diff_cleanupSemanticLossless, "diff_cleanupSemanticLossless");
    function diff_cleanupMerge(diffs, fix_unicode) {
      diffs.push([DIFF_EQUAL, ""]);
      var pointer = 0;
      var count_delete = 0;
      var count_insert = 0;
      var text_delete = "";
      var text_insert = "";
      var commonlength;
      while (pointer < diffs.length) {
        if (pointer < diffs.length - 1 && !diffs[pointer][1]) {
          diffs.splice(pointer, 1);
          continue;
        }
        switch (diffs[pointer][0]) {
          case DIFF_INSERT:
            count_insert++;
            text_insert += diffs[pointer][1];
            pointer++;
            break;
          case DIFF_DELETE:
            count_delete++;
            text_delete += diffs[pointer][1];
            pointer++;
            break;
          case DIFF_EQUAL:
            var previous_equality = pointer - count_insert - count_delete - 1;
            if (fix_unicode) {
              if (previous_equality >= 0 && ends_with_pair_start(diffs[previous_equality][1])) {
                var stray = diffs[previous_equality][1].slice(-1);
                diffs[previous_equality][1] = diffs[previous_equality][1].slice(
                  0,
                  -1
                );
                text_delete = stray + text_delete;
                text_insert = stray + text_insert;
                if (!diffs[previous_equality][1]) {
                  diffs.splice(previous_equality, 1);
                  pointer--;
                  var k = previous_equality - 1;
                  if (diffs[k] && diffs[k][0] === DIFF_INSERT) {
                    count_insert++;
                    text_insert = diffs[k][1] + text_insert;
                    k--;
                  }
                  if (diffs[k] && diffs[k][0] === DIFF_DELETE) {
                    count_delete++;
                    text_delete = diffs[k][1] + text_delete;
                    k--;
                  }
                  previous_equality = k;
                }
              }
              if (starts_with_pair_end(diffs[pointer][1])) {
                var stray = diffs[pointer][1].charAt(0);
                diffs[pointer][1] = diffs[pointer][1].slice(1);
                text_delete += stray;
                text_insert += stray;
              }
            }
            if (pointer < diffs.length - 1 && !diffs[pointer][1]) {
              diffs.splice(pointer, 1);
              break;
            }
            if (text_delete.length > 0 || text_insert.length > 0) {
              if (text_delete.length > 0 && text_insert.length > 0) {
                commonlength = diff_commonPrefix(text_insert, text_delete);
                if (commonlength !== 0) {
                  if (previous_equality >= 0) {
                    diffs[previous_equality][1] += text_insert.substring(
                      0,
                      commonlength
                    );
                  } else {
                    diffs.splice(0, 0, [
                      DIFF_EQUAL,
                      text_insert.substring(0, commonlength)
                    ]);
                    pointer++;
                  }
                  text_insert = text_insert.substring(commonlength);
                  text_delete = text_delete.substring(commonlength);
                }
                commonlength = diff_commonSuffix(text_insert, text_delete);
                if (commonlength !== 0) {
                  diffs[pointer][1] = text_insert.substring(text_insert.length - commonlength) + diffs[pointer][1];
                  text_insert = text_insert.substring(
                    0,
                    text_insert.length - commonlength
                  );
                  text_delete = text_delete.substring(
                    0,
                    text_delete.length - commonlength
                  );
                }
              }
              var n = count_insert + count_delete;
              if (text_delete.length === 0 && text_insert.length === 0) {
                diffs.splice(pointer - n, n);
                pointer = pointer - n;
              } else if (text_delete.length === 0) {
                diffs.splice(pointer - n, n, [DIFF_INSERT, text_insert]);
                pointer = pointer - n + 1;
              } else if (text_insert.length === 0) {
                diffs.splice(pointer - n, n, [DIFF_DELETE, text_delete]);
                pointer = pointer - n + 1;
              } else {
                diffs.splice(
                  pointer - n,
                  n,
                  [DIFF_DELETE, text_delete],
                  [DIFF_INSERT, text_insert]
                );
                pointer = pointer - n + 2;
              }
            }
            if (pointer !== 0 && diffs[pointer - 1][0] === DIFF_EQUAL) {
              diffs[pointer - 1][1] += diffs[pointer][1];
              diffs.splice(pointer, 1);
            } else {
              pointer++;
            }
            count_insert = 0;
            count_delete = 0;
            text_delete = "";
            text_insert = "";
            break;
        }
      }
      if (diffs[diffs.length - 1][1] === "") {
        diffs.pop();
      }
      var changes = false;
      pointer = 1;
      while (pointer < diffs.length - 1) {
        if (diffs[pointer - 1][0] === DIFF_EQUAL && diffs[pointer + 1][0] === DIFF_EQUAL) {
          if (diffs[pointer][1].substring(
            diffs[pointer][1].length - diffs[pointer - 1][1].length
          ) === diffs[pointer - 1][1]) {
            diffs[pointer][1] = diffs[pointer - 1][1] + diffs[pointer][1].substring(
              0,
              diffs[pointer][1].length - diffs[pointer - 1][1].length
            );
            diffs[pointer + 1][1] = diffs[pointer - 1][1] + diffs[pointer + 1][1];
            diffs.splice(pointer - 1, 1);
            changes = true;
          } else if (diffs[pointer][1].substring(0, diffs[pointer + 1][1].length) == diffs[pointer + 1][1]) {
            diffs[pointer - 1][1] += diffs[pointer + 1][1];
            diffs[pointer][1] = diffs[pointer][1].substring(diffs[pointer + 1][1].length) + diffs[pointer + 1][1];
            diffs.splice(pointer + 1, 1);
            changes = true;
          }
        }
        pointer++;
      }
      if (changes) {
        diff_cleanupMerge(diffs, fix_unicode);
      }
    }
    __name(diff_cleanupMerge, "diff_cleanupMerge");
    function is_surrogate_pair_start(charCode) {
      return charCode >= 55296 && charCode <= 56319;
    }
    __name(is_surrogate_pair_start, "is_surrogate_pair_start");
    function is_surrogate_pair_end(charCode) {
      return charCode >= 56320 && charCode <= 57343;
    }
    __name(is_surrogate_pair_end, "is_surrogate_pair_end");
    function starts_with_pair_end(str) {
      return is_surrogate_pair_end(str.charCodeAt(0));
    }
    __name(starts_with_pair_end, "starts_with_pair_end");
    function ends_with_pair_start(str) {
      return is_surrogate_pair_start(str.charCodeAt(str.length - 1));
    }
    __name(ends_with_pair_start, "ends_with_pair_start");
    function remove_empty_tuples(tuples) {
      var ret = [];
      for (var i = 0; i < tuples.length; i++) {
        if (tuples[i][1].length > 0) {
          ret.push(tuples[i]);
        }
      }
      return ret;
    }
    __name(remove_empty_tuples, "remove_empty_tuples");
    function make_edit_splice(before, oldMiddle, newMiddle, after) {
      if (ends_with_pair_start(before) || starts_with_pair_end(after)) {
        return null;
      }
      return remove_empty_tuples([
        [DIFF_EQUAL, before],
        [DIFF_DELETE, oldMiddle],
        [DIFF_INSERT, newMiddle],
        [DIFF_EQUAL, after]
      ]);
    }
    __name(make_edit_splice, "make_edit_splice");
    function find_cursor_edit_diff(oldText, newText, cursor_pos) {
      var oldRange = typeof cursor_pos === "number" ? { index: cursor_pos, length: 0 } : cursor_pos.oldRange;
      var newRange = typeof cursor_pos === "number" ? null : cursor_pos.newRange;
      var oldLength = oldText.length;
      var newLength = newText.length;
      if (oldRange.length === 0 && (newRange === null || newRange.length === 0)) {
        var oldCursor = oldRange.index;
        var oldBefore = oldText.slice(0, oldCursor);
        var oldAfter = oldText.slice(oldCursor);
        var maybeNewCursor = newRange ? newRange.index : null;
        editBefore: {
          var newCursor = oldCursor + newLength - oldLength;
          if (maybeNewCursor !== null && maybeNewCursor !== newCursor) {
            break editBefore;
          }
          if (newCursor < 0 || newCursor > newLength) {
            break editBefore;
          }
          var newBefore = newText.slice(0, newCursor);
          var newAfter = newText.slice(newCursor);
          if (newAfter !== oldAfter) {
            break editBefore;
          }
          var prefixLength = Math.min(oldCursor, newCursor);
          var oldPrefix = oldBefore.slice(0, prefixLength);
          var newPrefix = newBefore.slice(0, prefixLength);
          if (oldPrefix !== newPrefix) {
            break editBefore;
          }
          var oldMiddle = oldBefore.slice(prefixLength);
          var newMiddle = newBefore.slice(prefixLength);
          return make_edit_splice(oldPrefix, oldMiddle, newMiddle, oldAfter);
        }
        editAfter: {
          if (maybeNewCursor !== null && maybeNewCursor !== oldCursor) {
            break editAfter;
          }
          var cursor = oldCursor;
          var newBefore = newText.slice(0, cursor);
          var newAfter = newText.slice(cursor);
          if (newBefore !== oldBefore) {
            break editAfter;
          }
          var suffixLength = Math.min(oldLength - cursor, newLength - cursor);
          var oldSuffix = oldAfter.slice(oldAfter.length - suffixLength);
          var newSuffix = newAfter.slice(newAfter.length - suffixLength);
          if (oldSuffix !== newSuffix) {
            break editAfter;
          }
          var oldMiddle = oldAfter.slice(0, oldAfter.length - suffixLength);
          var newMiddle = newAfter.slice(0, newAfter.length - suffixLength);
          return make_edit_splice(oldBefore, oldMiddle, newMiddle, oldSuffix);
        }
      }
      if (oldRange.length > 0 && newRange && newRange.length === 0) {
        replaceRange: {
          var oldPrefix = oldText.slice(0, oldRange.index);
          var oldSuffix = oldText.slice(oldRange.index + oldRange.length);
          var prefixLength = oldPrefix.length;
          var suffixLength = oldSuffix.length;
          if (newLength < prefixLength + suffixLength) {
            break replaceRange;
          }
          var newPrefix = newText.slice(0, prefixLength);
          var newSuffix = newText.slice(newLength - suffixLength);
          if (oldPrefix !== newPrefix || oldSuffix !== newSuffix) {
            break replaceRange;
          }
          var oldMiddle = oldText.slice(prefixLength, oldLength - suffixLength);
          var newMiddle = newText.slice(prefixLength, newLength - suffixLength);
          return make_edit_splice(oldPrefix, oldMiddle, newMiddle, oldSuffix);
        }
      }
      return null;
    }
    __name(find_cursor_edit_diff, "find_cursor_edit_diff");
    function diff(text1, text2, cursor_pos, cleanup) {
      return diff_main(text1, text2, cursor_pos, cleanup, true);
    }
    __name(diff, "diff");
    diff.INSERT = DIFF_INSERT;
    diff.DELETE = DIFF_DELETE;
    diff.EQUAL = DIFF_EQUAL;
    module2.exports = diff;
  }
});

// node_modules/vscode-languageserver-types/lib/umd/main.js
var require_main = __commonJS({
  "node_modules/vscode-languageserver-types/lib/umd/main.js"(exports2, module2) {
    (function(factory) {
      if (typeof module2 === "object" && typeof module2.exports === "object") {
        var v = factory(require, exports2);
        if (v !== void 0) module2.exports = v;
      } else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
      }
    })(function(require2, exports3) {
      "use strict";
      Object.defineProperty(exports3, "__esModule", { value: true });
      exports3.TextDocument = exports3.EOL = exports3.WorkspaceFolder = exports3.InlineCompletionContext = exports3.SelectedCompletionInfo = exports3.InlineCompletionTriggerKind = exports3.InlineCompletionList = exports3.InlineCompletionItem = exports3.StringValue = exports3.InlayHint = exports3.InlayHintLabelPart = exports3.InlayHintKind = exports3.InlineValueContext = exports3.InlineValueEvaluatableExpression = exports3.InlineValueVariableLookup = exports3.InlineValueText = exports3.SemanticTokens = exports3.SemanticTokenModifiers = exports3.SemanticTokenTypes = exports3.SelectionRange = exports3.DocumentLink = exports3.FormattingOptions = exports3.CodeLens = exports3.CodeAction = exports3.CodeActionContext = exports3.CodeActionTriggerKind = exports3.CodeActionKind = exports3.DocumentSymbol = exports3.WorkspaceSymbol = exports3.SymbolInformation = exports3.SymbolTag = exports3.SymbolKind = exports3.DocumentHighlight = exports3.DocumentHighlightKind = exports3.SignatureInformation = exports3.ParameterInformation = exports3.Hover = exports3.MarkedString = exports3.CompletionList = exports3.CompletionItem = exports3.CompletionItemLabelDetails = exports3.InsertTextMode = exports3.InsertReplaceEdit = exports3.CompletionItemTag = exports3.InsertTextFormat = exports3.CompletionItemKind = exports3.MarkupContent = exports3.MarkupKind = exports3.TextDocumentItem = exports3.OptionalVersionedTextDocumentIdentifier = exports3.VersionedTextDocumentIdentifier = exports3.TextDocumentIdentifier = exports3.WorkspaceChange = exports3.WorkspaceEdit = exports3.DeleteFile = exports3.RenameFile = exports3.CreateFile = exports3.TextDocumentEdit = exports3.AnnotatedTextEdit = exports3.ChangeAnnotationIdentifier = exports3.ChangeAnnotation = exports3.TextEdit = exports3.Command = exports3.Diagnostic = exports3.CodeDescription = exports3.DiagnosticTag = exports3.DiagnosticSeverity = exports3.DiagnosticRelatedInformation = exports3.FoldingRange = exports3.FoldingRangeKind = exports3.ColorPresentation = exports3.ColorInformation = exports3.Color = exports3.LocationLink = exports3.Location = exports3.Range = exports3.Position = exports3.uinteger = exports3.integer = exports3.URI = exports3.DocumentUri = void 0;
      var DocumentUri;
      (function(DocumentUri2) {
        function is(value) {
          return typeof value === "string";
        }
        __name(is, "is");
        DocumentUri2.is = is;
      })(DocumentUri || (exports3.DocumentUri = DocumentUri = {}));
      var URI;
      (function(URI2) {
        function is(value) {
          return typeof value === "string";
        }
        __name(is, "is");
        URI2.is = is;
      })(URI || (exports3.URI = URI = {}));
      var integer;
      (function(integer2) {
        integer2.MIN_VALUE = -2147483648;
        integer2.MAX_VALUE = 2147483647;
        function is(value) {
          return typeof value === "number" && integer2.MIN_VALUE <= value && value <= integer2.MAX_VALUE;
        }
        __name(is, "is");
        integer2.is = is;
      })(integer || (exports3.integer = integer = {}));
      var uinteger;
      (function(uinteger2) {
        uinteger2.MIN_VALUE = 0;
        uinteger2.MAX_VALUE = 2147483647;
        function is(value) {
          return typeof value === "number" && uinteger2.MIN_VALUE <= value && value <= uinteger2.MAX_VALUE;
        }
        __name(is, "is");
        uinteger2.is = is;
      })(uinteger || (exports3.uinteger = uinteger = {}));
      var Position;
      (function(Position2) {
        function create(line, character) {
          if (line === Number.MAX_VALUE) {
            line = uinteger.MAX_VALUE;
          }
          if (character === Number.MAX_VALUE) {
            character = uinteger.MAX_VALUE;
          }
          return { line, character };
        }
        __name(create, "create");
        Position2.create = create;
        function is(value) {
          var candidate = value;
          return Is.objectLiteral(candidate) && Is.uinteger(candidate.line) && Is.uinteger(candidate.character);
        }
        __name(is, "is");
        Position2.is = is;
      })(Position || (exports3.Position = Position = {}));
      var Range;
      (function(Range2) {
        function create(one, two, three, four) {
          if (Is.uinteger(one) && Is.uinteger(two) && Is.uinteger(three) && Is.uinteger(four)) {
            return { start: Position.create(one, two), end: Position.create(three, four) };
          } else if (Position.is(one) && Position.is(two)) {
            return { start: one, end: two };
          } else {
            throw new Error("Range#create called with invalid arguments[".concat(one, ", ").concat(two, ", ").concat(three, ", ").concat(four, "]"));
          }
        }
        __name(create, "create");
        Range2.create = create;
        function is(value) {
          var candidate = value;
          return Is.objectLiteral(candidate) && Position.is(candidate.start) && Position.is(candidate.end);
        }
        __name(is, "is");
        Range2.is = is;
      })(Range || (exports3.Range = Range = {}));
      var Location;
      (function(Location2) {
        function create(uri, range) {
          return { uri, range };
        }
        __name(create, "create");
        Location2.create = create;
        function is(value) {
          var candidate = value;
          return Is.objectLiteral(candidate) && Range.is(candidate.range) && (Is.string(candidate.uri) || Is.undefined(candidate.uri));
        }
        __name(is, "is");
        Location2.is = is;
      })(Location || (exports3.Location = Location = {}));
      var LocationLink;
      (function(LocationLink2) {
        function create(targetUri, targetRange, targetSelectionRange, originSelectionRange) {
          return { targetUri, targetRange, targetSelectionRange, originSelectionRange };
        }
        __name(create, "create");
        LocationLink2.create = create;
        function is(value) {
          var candidate = value;
          return Is.objectLiteral(candidate) && Range.is(candidate.targetRange) && Is.string(candidate.targetUri) && Range.is(candidate.targetSelectionRange) && (Range.is(candidate.originSelectionRange) || Is.undefined(candidate.originSelectionRange));
        }
        __name(is, "is");
        LocationLink2.is = is;
      })(LocationLink || (exports3.LocationLink = LocationLink = {}));
      var Color;
      (function(Color2) {
        function create(red, green, blue, alpha) {
          return {
            red,
            green,
            blue,
            alpha
          };
        }
        __name(create, "create");
        Color2.create = create;
        function is(value) {
          var candidate = value;
          return Is.objectLiteral(candidate) && Is.numberRange(candidate.red, 0, 1) && Is.numberRange(candidate.green, 0, 1) && Is.numberRange(candidate.blue, 0, 1) && Is.numberRange(candidate.alpha, 0, 1);
        }
        __name(is, "is");
        Color2.is = is;
      })(Color || (exports3.Color = Color = {}));
      var ColorInformation;
      (function(ColorInformation2) {
        function create(range, color) {
          return {
            range,
            color
          };
        }
        __name(create, "create");
        ColorInformation2.create = create;
        function is(value) {
          var candidate = value;
          return Is.objectLiteral(candidate) && Range.is(candidate.range) && Color.is(candidate.color);
        }
        __name(is, "is");
        ColorInformation2.is = is;
      })(ColorInformation || (exports3.ColorInformation = ColorInformation = {}));
      var ColorPresentation;
      (function(ColorPresentation2) {
        function create(label, textEdit, additionalTextEdits) {
          return {
            label,
            textEdit,
            additionalTextEdits
          };
        }
        __name(create, "create");
        ColorPresentation2.create = create;
        function is(value) {
          var candidate = value;
          return Is.objectLiteral(candidate) && Is.string(candidate.label) && (Is.undefined(candidate.textEdit) || TextEdit.is(candidate)) && (Is.undefined(candidate.additionalTextEdits) || Is.typedArray(candidate.additionalTextEdits, TextEdit.is));
        }
        __name(is, "is");
        ColorPresentation2.is = is;
      })(ColorPresentation || (exports3.ColorPresentation = ColorPresentation = {}));
      var FoldingRangeKind;
      (function(FoldingRangeKind2) {
        FoldingRangeKind2.Comment = "comment";
        FoldingRangeKind2.Imports = "imports";
        FoldingRangeKind2.Region = "region";
      })(FoldingRangeKind || (exports3.FoldingRangeKind = FoldingRangeKind = {}));
      var FoldingRange;
      (function(FoldingRange2) {
        function create(startLine, endLine, startCharacter, endCharacter, kind, collapsedText) {
          var result = {
            startLine,
            endLine
          };
          if (Is.defined(startCharacter)) {
            result.startCharacter = startCharacter;
          }
          if (Is.defined(endCharacter)) {
            result.endCharacter = endCharacter;
          }
          if (Is.defined(kind)) {
            result.kind = kind;
          }
          if (Is.defined(collapsedText)) {
            result.collapsedText = collapsedText;
          }
          return result;
        }
        __name(create, "create");
        FoldingRange2.create = create;
        function is(value) {
          var candidate = value;
          return Is.objectLiteral(candidate) && Is.uinteger(candidate.startLine) && Is.uinteger(candidate.startLine) && (Is.undefined(candidate.startCharacter) || Is.uinteger(candidate.startCharacter)) && (Is.undefined(candidate.endCharacter) || Is.uinteger(candidate.endCharacter)) && (Is.undefined(candidate.kind) || Is.string(candidate.kind));
        }
        __name(is, "is");
        FoldingRange2.is = is;
      })(FoldingRange || (exports3.FoldingRange = FoldingRange = {}));
      var DiagnosticRelatedInformation;
      (function(DiagnosticRelatedInformation2) {
        function create(location, message) {
          return {
            location,
            message
          };
        }
        __name(create, "create");
        DiagnosticRelatedInformation2.create = create;
        function is(value) {
          var candidate = value;
          return Is.defined(candidate) && Location.is(candidate.location) && Is.string(candidate.message);
        }
        __name(is, "is");
        DiagnosticRelatedInformation2.is = is;
      })(DiagnosticRelatedInformation || (exports3.DiagnosticRelatedInformation = DiagnosticRelatedInformation = {}));
      var DiagnosticSeverity;
      (function(DiagnosticSeverity2) {
        DiagnosticSeverity2.Error = 1;
        DiagnosticSeverity2.Warning = 2;
        DiagnosticSeverity2.Information = 3;
        DiagnosticSeverity2.Hint = 4;
      })(DiagnosticSeverity || (exports3.DiagnosticSeverity = DiagnosticSeverity = {}));
      var DiagnosticTag;
      (function(DiagnosticTag2) {
        DiagnosticTag2.Unnecessary = 1;
        DiagnosticTag2.Deprecated = 2;
      })(DiagnosticTag || (exports3.DiagnosticTag = DiagnosticTag = {}));
      var CodeDescription;
      (function(CodeDescription2) {
        function is(value) {
          var candidate = value;
          return Is.objectLiteral(candidate) && Is.string(candidate.href);
        }
        __name(is, "is");
        CodeDescription2.is = is;
      })(CodeDescription || (exports3.CodeDescription = CodeDescription = {}));
      var Diagnostic;
      (function(Diagnostic2) {
        function create(range, message, severity, code, source, relatedInformation) {
          var result = { range, message };
          if (Is.defined(severity)) {
            result.severity = severity;
          }
          if (Is.defined(code)) {
            result.code = code;
          }
          if (Is.defined(source)) {
            result.source = source;
          }
          if (Is.defined(relatedInformation)) {
            result.relatedInformation = relatedInformation;
          }
          return result;
        }
        __name(create, "create");
        Diagnostic2.create = create;
        function is(value) {
          var _a;
          var candidate = value;
          return Is.defined(candidate) && Range.is(candidate.range) && Is.string(candidate.message) && (Is.number(candidate.severity) || Is.undefined(candidate.severity)) && (Is.integer(candidate.code) || Is.string(candidate.code) || Is.undefined(candidate.code)) && (Is.undefined(candidate.codeDescription) || Is.string((_a = candidate.codeDescription) === null || _a === void 0 ? void 0 : _a.href)) && (Is.string(candidate.source) || Is.undefined(candidate.source)) && (Is.undefined(candidate.relatedInformation) || Is.typedArray(candidate.relatedInformation, DiagnosticRelatedInformation.is));
        }
        __name(is, "is");
        Diagnostic2.is = is;
      })(Diagnostic || (exports3.Diagnostic = Diagnostic = {}));
      var Command;
      (function(Command2) {
        function create(title, command) {
          var args = [];
          for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
          }
          var result = { title, command };
          if (Is.defined(args) && args.length > 0) {
            result.arguments = args;
          }
          return result;
        }
        __name(create, "create");
        Command2.create = create;
        function is(value) {
          var candidate = value;
          return Is.defined(candidate) && Is.string(candidate.title) && Is.string(candidate.command);
        }
        __name(is, "is");
        Command2.is = is;
      })(Command || (exports3.Command = Command = {}));
      var TextEdit;
      (function(TextEdit2) {
        function replace(range, newText) {
          return { range, newText };
        }
        __name(replace, "replace");
        TextEdit2.replace = replace;
        function insert(position, newText) {
          return { range: { start: position, end: position }, newText };
        }
        __name(insert, "insert");
        TextEdit2.insert = insert;
        function del(range) {
          return { range, newText: "" };
        }
        __name(del, "del");
        TextEdit2.del = del;
        function is(value) {
          var candidate = value;
          return Is.objectLiteral(candidate) && Is.string(candidate.newText) && Range.is(candidate.range);
        }
        __name(is, "is");
        TextEdit2.is = is;
      })(TextEdit || (exports3.TextEdit = TextEdit = {}));
      var ChangeAnnotation;
      (function(ChangeAnnotation2) {
        function create(label, needsConfirmation, description) {
          var result = { label };
          if (needsConfirmation !== void 0) {
            result.needsConfirmation = needsConfirmation;
          }
          if (description !== void 0) {
            result.description = description;
          }
          return result;
        }
        __name(create, "create");
        ChangeAnnotation2.create = create;
        function is(value) {
          var candidate = value;
          return Is.objectLiteral(candidate) && Is.string(candidate.label) && (Is.boolean(candidate.needsConfirmation) || candidate.needsConfirmation === void 0) && (Is.string(candidate.description) || candidate.description === void 0);
        }
        __name(is, "is");
        ChangeAnnotation2.is = is;
      })(ChangeAnnotation || (exports3.ChangeAnnotation = ChangeAnnotation = {}));
      var ChangeAnnotationIdentifier;
      (function(ChangeAnnotationIdentifier2) {
        function is(value) {
          var candidate = value;
          return Is.string(candidate);
        }
        __name(is, "is");
        ChangeAnnotationIdentifier2.is = is;
      })(ChangeAnnotationIdentifier || (exports3.ChangeAnnotationIdentifier = ChangeAnnotationIdentifier = {}));
      var AnnotatedTextEdit;
      (function(AnnotatedTextEdit2) {
        function replace(range, newText, annotation) {
          return { range, newText, annotationId: annotation };
        }
        __name(replace, "replace");
        AnnotatedTextEdit2.replace = replace;
        function insert(position, newText, annotation) {
          return { range: { start: position, end: position }, newText, annotationId: annotation };
        }
        __name(insert, "insert");
        AnnotatedTextEdit2.insert = insert;
        function del(range, annotation) {
          return { range, newText: "", annotationId: annotation };
        }
        __name(del, "del");
        AnnotatedTextEdit2.del = del;
        function is(value) {
          var candidate = value;
          return TextEdit.is(candidate) && (ChangeAnnotation.is(candidate.annotationId) || ChangeAnnotationIdentifier.is(candidate.annotationId));
        }
        __name(is, "is");
        AnnotatedTextEdit2.is = is;
      })(AnnotatedTextEdit || (exports3.AnnotatedTextEdit = AnnotatedTextEdit = {}));
      var TextDocumentEdit;
      (function(TextDocumentEdit2) {
        function create(textDocument, edits) {
          return { textDocument, edits };
        }
        __name(create, "create");
        TextDocumentEdit2.create = create;
        function is(value) {
          var candidate = value;
          return Is.defined(candidate) && OptionalVersionedTextDocumentIdentifier.is(candidate.textDocument) && Array.isArray(candidate.edits);
        }
        __name(is, "is");
        TextDocumentEdit2.is = is;
      })(TextDocumentEdit || (exports3.TextDocumentEdit = TextDocumentEdit = {}));
      var CreateFile;
      (function(CreateFile2) {
        function create(uri, options, annotation) {
          var result = {
            kind: "create",
            uri
          };
          if (options !== void 0 && (options.overwrite !== void 0 || options.ignoreIfExists !== void 0)) {
            result.options = options;
          }
          if (annotation !== void 0) {
            result.annotationId = annotation;
          }
          return result;
        }
        __name(create, "create");
        CreateFile2.create = create;
        function is(value) {
          var candidate = value;
          return candidate && candidate.kind === "create" && Is.string(candidate.uri) && (candidate.options === void 0 || (candidate.options.overwrite === void 0 || Is.boolean(candidate.options.overwrite)) && (candidate.options.ignoreIfExists === void 0 || Is.boolean(candidate.options.ignoreIfExists))) && (candidate.annotationId === void 0 || ChangeAnnotationIdentifier.is(candidate.annotationId));
        }
        __name(is, "is");
        CreateFile2.is = is;
      })(CreateFile || (exports3.CreateFile = CreateFile = {}));
      var RenameFile;
      (function(RenameFile2) {
        function create(oldUri, newUri, options, annotation) {
          var result = {
            kind: "rename",
            oldUri,
            newUri
          };
          if (options !== void 0 && (options.overwrite !== void 0 || options.ignoreIfExists !== void 0)) {
            result.options = options;
          }
          if (annotation !== void 0) {
            result.annotationId = annotation;
          }
          return result;
        }
        __name(create, "create");
        RenameFile2.create = create;
        function is(value) {
          var candidate = value;
          return candidate && candidate.kind === "rename" && Is.string(candidate.oldUri) && Is.string(candidate.newUri) && (candidate.options === void 0 || (candidate.options.overwrite === void 0 || Is.boolean(candidate.options.overwrite)) && (candidate.options.ignoreIfExists === void 0 || Is.boolean(candidate.options.ignoreIfExists))) && (candidate.annotationId === void 0 || ChangeAnnotationIdentifier.is(candidate.annotationId));
        }
        __name(is, "is");
        RenameFile2.is = is;
      })(RenameFile || (exports3.RenameFile = RenameFile = {}));
      var DeleteFile;
      (function(DeleteFile2) {
        function create(uri, options, annotation) {
          var result = {
            kind: "delete",
            uri
          };
          if (options !== void 0 && (options.recursive !== void 0 || options.ignoreIfNotExists !== void 0)) {
            result.options = options;
          }
          if (annotation !== void 0) {
            result.annotationId = annotation;
          }
          return result;
        }
        __name(create, "create");
        DeleteFile2.create = create;
        function is(value) {
          var candidate = value;
          return candidate && candidate.kind === "delete" && Is.string(candidate.uri) && (candidate.options === void 0 || (candidate.options.recursive === void 0 || Is.boolean(candidate.options.recursive)) && (candidate.options.ignoreIfNotExists === void 0 || Is.boolean(candidate.options.ignoreIfNotExists))) && (candidate.annotationId === void 0 || ChangeAnnotationIdentifier.is(candidate.annotationId));
        }
        __name(is, "is");
        DeleteFile2.is = is;
      })(DeleteFile || (exports3.DeleteFile = DeleteFile = {}));
      var WorkspaceEdit;
      (function(WorkspaceEdit2) {
        function is(value) {
          var candidate = value;
          return candidate && (candidate.changes !== void 0 || candidate.documentChanges !== void 0) && (candidate.documentChanges === void 0 || candidate.documentChanges.every(function(change) {
            if (Is.string(change.kind)) {
              return CreateFile.is(change) || RenameFile.is(change) || DeleteFile.is(change);
            } else {
              return TextDocumentEdit.is(change);
            }
          }));
        }
        __name(is, "is");
        WorkspaceEdit2.is = is;
      })(WorkspaceEdit || (exports3.WorkspaceEdit = WorkspaceEdit = {}));
      var TextEditChangeImpl = (
        /** @class */
        (function() {
          function TextEditChangeImpl2(edits, changeAnnotations) {
            this.edits = edits;
            this.changeAnnotations = changeAnnotations;
          }
          __name(TextEditChangeImpl2, "TextEditChangeImpl");
          TextEditChangeImpl2.prototype.insert = function(position, newText, annotation) {
            var edit;
            var id;
            if (annotation === void 0) {
              edit = TextEdit.insert(position, newText);
            } else if (ChangeAnnotationIdentifier.is(annotation)) {
              id = annotation;
              edit = AnnotatedTextEdit.insert(position, newText, annotation);
            } else {
              this.assertChangeAnnotations(this.changeAnnotations);
              id = this.changeAnnotations.manage(annotation);
              edit = AnnotatedTextEdit.insert(position, newText, id);
            }
            this.edits.push(edit);
            if (id !== void 0) {
              return id;
            }
          };
          TextEditChangeImpl2.prototype.replace = function(range, newText, annotation) {
            var edit;
            var id;
            if (annotation === void 0) {
              edit = TextEdit.replace(range, newText);
            } else if (ChangeAnnotationIdentifier.is(annotation)) {
              id = annotation;
              edit = AnnotatedTextEdit.replace(range, newText, annotation);
            } else {
              this.assertChangeAnnotations(this.changeAnnotations);
              id = this.changeAnnotations.manage(annotation);
              edit = AnnotatedTextEdit.replace(range, newText, id);
            }
            this.edits.push(edit);
            if (id !== void 0) {
              return id;
            }
          };
          TextEditChangeImpl2.prototype.delete = function(range, annotation) {
            var edit;
            var id;
            if (annotation === void 0) {
              edit = TextEdit.del(range);
            } else if (ChangeAnnotationIdentifier.is(annotation)) {
              id = annotation;
              edit = AnnotatedTextEdit.del(range, annotation);
            } else {
              this.assertChangeAnnotations(this.changeAnnotations);
              id = this.changeAnnotations.manage(annotation);
              edit = AnnotatedTextEdit.del(range, id);
            }
            this.edits.push(edit);
            if (id !== void 0) {
              return id;
            }
          };
          TextEditChangeImpl2.prototype.add = function(edit) {
            this.edits.push(edit);
          };
          TextEditChangeImpl2.prototype.all = function() {
            return this.edits;
          };
          TextEditChangeImpl2.prototype.clear = function() {
            this.edits.splice(0, this.edits.length);
          };
          TextEditChangeImpl2.prototype.assertChangeAnnotations = function(value) {
            if (value === void 0) {
              throw new Error("Text edit change is not configured to manage change annotations.");
            }
          };
          return TextEditChangeImpl2;
        })()
      );
      var ChangeAnnotations = (
        /** @class */
        (function() {
          function ChangeAnnotations2(annotations) {
            this._annotations = annotations === void 0 ? /* @__PURE__ */ Object.create(null) : annotations;
            this._counter = 0;
            this._size = 0;
          }
          __name(ChangeAnnotations2, "ChangeAnnotations");
          ChangeAnnotations2.prototype.all = function() {
            return this._annotations;
          };
          Object.defineProperty(ChangeAnnotations2.prototype, "size", {
            get: /* @__PURE__ */ __name(function() {
              return this._size;
            }, "get"),
            enumerable: false,
            configurable: true
          });
          ChangeAnnotations2.prototype.manage = function(idOrAnnotation, annotation) {
            var id;
            if (ChangeAnnotationIdentifier.is(idOrAnnotation)) {
              id = idOrAnnotation;
            } else {
              id = this.nextId();
              annotation = idOrAnnotation;
            }
            if (this._annotations[id] !== void 0) {
              throw new Error("Id ".concat(id, " is already in use."));
            }
            if (annotation === void 0) {
              throw new Error("No annotation provided for id ".concat(id));
            }
            this._annotations[id] = annotation;
            this._size++;
            return id;
          };
          ChangeAnnotations2.prototype.nextId = function() {
            this._counter++;
            return this._counter.toString();
          };
          return ChangeAnnotations2;
        })()
      );
      var WorkspaceChange = (
        /** @class */
        (function() {
          function WorkspaceChange2(workspaceEdit) {
            var _this = this;
            this._textEditChanges = /* @__PURE__ */ Object.create(null);
            if (workspaceEdit !== void 0) {
              this._workspaceEdit = workspaceEdit;
              if (workspaceEdit.documentChanges) {
                this._changeAnnotations = new ChangeAnnotations(workspaceEdit.changeAnnotations);
                workspaceEdit.changeAnnotations = this._changeAnnotations.all();
                workspaceEdit.documentChanges.forEach(function(change) {
                  if (TextDocumentEdit.is(change)) {
                    var textEditChange = new TextEditChangeImpl(change.edits, _this._changeAnnotations);
                    _this._textEditChanges[change.textDocument.uri] = textEditChange;
                  }
                });
              } else if (workspaceEdit.changes) {
                Object.keys(workspaceEdit.changes).forEach(function(key) {
                  var textEditChange = new TextEditChangeImpl(workspaceEdit.changes[key]);
                  _this._textEditChanges[key] = textEditChange;
                });
              }
            } else {
              this._workspaceEdit = {};
            }
          }
          __name(WorkspaceChange2, "WorkspaceChange");
          Object.defineProperty(WorkspaceChange2.prototype, "edit", {
            /**
             * Returns the underlying {@link WorkspaceEdit} literal
             * use to be returned from a workspace edit operation like rename.
             */
            get: /* @__PURE__ */ __name(function() {
              this.initDocumentChanges();
              if (this._changeAnnotations !== void 0) {
                if (this._changeAnnotations.size === 0) {
                  this._workspaceEdit.changeAnnotations = void 0;
                } else {
                  this._workspaceEdit.changeAnnotations = this._changeAnnotations.all();
                }
              }
              return this._workspaceEdit;
            }, "get"),
            enumerable: false,
            configurable: true
          });
          WorkspaceChange2.prototype.getTextEditChange = function(key) {
            if (OptionalVersionedTextDocumentIdentifier.is(key)) {
              this.initDocumentChanges();
              if (this._workspaceEdit.documentChanges === void 0) {
                throw new Error("Workspace edit is not configured for document changes.");
              }
              var textDocument = { uri: key.uri, version: key.version };
              var result = this._textEditChanges[textDocument.uri];
              if (!result) {
                var edits = [];
                var textDocumentEdit = {
                  textDocument,
                  edits
                };
                this._workspaceEdit.documentChanges.push(textDocumentEdit);
                result = new TextEditChangeImpl(edits, this._changeAnnotations);
                this._textEditChanges[textDocument.uri] = result;
              }
              return result;
            } else {
              this.initChanges();
              if (this._workspaceEdit.changes === void 0) {
                throw new Error("Workspace edit is not configured for normal text edit changes.");
              }
              var result = this._textEditChanges[key];
              if (!result) {
                var edits = [];
                this._workspaceEdit.changes[key] = edits;
                result = new TextEditChangeImpl(edits);
                this._textEditChanges[key] = result;
              }
              return result;
            }
          };
          WorkspaceChange2.prototype.initDocumentChanges = function() {
            if (this._workspaceEdit.documentChanges === void 0 && this._workspaceEdit.changes === void 0) {
              this._changeAnnotations = new ChangeAnnotations();
              this._workspaceEdit.documentChanges = [];
              this._workspaceEdit.changeAnnotations = this._changeAnnotations.all();
            }
          };
          WorkspaceChange2.prototype.initChanges = function() {
            if (this._workspaceEdit.documentChanges === void 0 && this._workspaceEdit.changes === void 0) {
              this._workspaceEdit.changes = /* @__PURE__ */ Object.create(null);
            }
          };
          WorkspaceChange2.prototype.createFile = function(uri, optionsOrAnnotation, options) {
            this.initDocumentChanges();
            if (this._workspaceEdit.documentChanges === void 0) {
              throw new Error("Workspace edit is not configured for document changes.");
            }
            var annotation;
            if (ChangeAnnotation.is(optionsOrAnnotation) || ChangeAnnotationIdentifier.is(optionsOrAnnotation)) {
              annotation = optionsOrAnnotation;
            } else {
              options = optionsOrAnnotation;
            }
            var operation;
            var id;
            if (annotation === void 0) {
              operation = CreateFile.create(uri, options);
            } else {
              id = ChangeAnnotationIdentifier.is(annotation) ? annotation : this._changeAnnotations.manage(annotation);
              operation = CreateFile.create(uri, options, id);
            }
            this._workspaceEdit.documentChanges.push(operation);
            if (id !== void 0) {
              return id;
            }
          };
          WorkspaceChange2.prototype.renameFile = function(oldUri, newUri, optionsOrAnnotation, options) {
            this.initDocumentChanges();
            if (this._workspaceEdit.documentChanges === void 0) {
              throw new Error("Workspace edit is not configured for document changes.");
            }
            var annotation;
            if (ChangeAnnotation.is(optionsOrAnnotation) || ChangeAnnotationIdentifier.is(optionsOrAnnotation)) {
              annotation = optionsOrAnnotation;
            } else {
              options = optionsOrAnnotation;
            }
            var operation;
            var id;
            if (annotation === void 0) {
              operation = RenameFile.create(oldUri, newUri, options);
            } else {
              id = ChangeAnnotationIdentifier.is(annotation) ? annotation : this._changeAnnotations.manage(annotation);
              operation = RenameFile.create(oldUri, newUri, options, id);
            }
            this._workspaceEdit.documentChanges.push(operation);
            if (id !== void 0) {
              return id;
            }
          };
          WorkspaceChange2.prototype.deleteFile = function(uri, optionsOrAnnotation, options) {
            this.initDocumentChanges();
            if (this._workspaceEdit.documentChanges === void 0) {
              throw new Error("Workspace edit is not configured for document changes.");
            }
            var annotation;
            if (ChangeAnnotation.is(optionsOrAnnotation) || ChangeAnnotationIdentifier.is(optionsOrAnnotation)) {
              annotation = optionsOrAnnotation;
            } else {
              options = optionsOrAnnotation;
            }
            var operation;
            var id;
            if (annotation === void 0) {
              operation = DeleteFile.create(uri, options);
            } else {
              id = ChangeAnnotationIdentifier.is(annotation) ? annotation : this._changeAnnotations.manage(annotation);
              operation = DeleteFile.create(uri, options, id);
            }
            this._workspaceEdit.documentChanges.push(operation);
            if (id !== void 0) {
              return id;
            }
          };
          return WorkspaceChange2;
        })()
      );
      exports3.WorkspaceChange = WorkspaceChange;
      var TextDocumentIdentifier;
      (function(TextDocumentIdentifier2) {
        function create(uri) {
          return { uri };
        }
        __name(create, "create");
        TextDocumentIdentifier2.create = create;
        function is(value) {
          var candidate = value;
          return Is.defined(candidate) && Is.string(candidate.uri);
        }
        __name(is, "is");
        TextDocumentIdentifier2.is = is;
      })(TextDocumentIdentifier || (exports3.TextDocumentIdentifier = TextDocumentIdentifier = {}));
      var VersionedTextDocumentIdentifier;
      (function(VersionedTextDocumentIdentifier2) {
        function create(uri, version) {
          return { uri, version };
        }
        __name(create, "create");
        VersionedTextDocumentIdentifier2.create = create;
        function is(value) {
          var candidate = value;
          return Is.defined(candidate) && Is.string(candidate.uri) && Is.integer(candidate.version);
        }
        __name(is, "is");
        VersionedTextDocumentIdentifier2.is = is;
      })(VersionedTextDocumentIdentifier || (exports3.VersionedTextDocumentIdentifier = VersionedTextDocumentIdentifier = {}));
      var OptionalVersionedTextDocumentIdentifier;
      (function(OptionalVersionedTextDocumentIdentifier2) {
        function create(uri, version) {
          return { uri, version };
        }
        __name(create, "create");
        OptionalVersionedTextDocumentIdentifier2.create = create;
        function is(value) {
          var candidate = value;
          return Is.defined(candidate) && Is.string(candidate.uri) && (candidate.version === null || Is.integer(candidate.version));
        }
        __name(is, "is");
        OptionalVersionedTextDocumentIdentifier2.is = is;
      })(OptionalVersionedTextDocumentIdentifier || (exports3.OptionalVersionedTextDocumentIdentifier = OptionalVersionedTextDocumentIdentifier = {}));
      var TextDocumentItem;
      (function(TextDocumentItem2) {
        function create(uri, languageId, version, text) {
          return { uri, languageId, version, text };
        }
        __name(create, "create");
        TextDocumentItem2.create = create;
        function is(value) {
          var candidate = value;
          return Is.defined(candidate) && Is.string(candidate.uri) && Is.string(candidate.languageId) && Is.integer(candidate.version) && Is.string(candidate.text);
        }
        __name(is, "is");
        TextDocumentItem2.is = is;
      })(TextDocumentItem || (exports3.TextDocumentItem = TextDocumentItem = {}));
      var MarkupKind;
      (function(MarkupKind2) {
        MarkupKind2.PlainText = "plaintext";
        MarkupKind2.Markdown = "markdown";
        function is(value) {
          var candidate = value;
          return candidate === MarkupKind2.PlainText || candidate === MarkupKind2.Markdown;
        }
        __name(is, "is");
        MarkupKind2.is = is;
      })(MarkupKind || (exports3.MarkupKind = MarkupKind = {}));
      var MarkupContent;
      (function(MarkupContent2) {
        function is(value) {
          var candidate = value;
          return Is.objectLiteral(value) && MarkupKind.is(candidate.kind) && Is.string(candidate.value);
        }
        __name(is, "is");
        MarkupContent2.is = is;
      })(MarkupContent || (exports3.MarkupContent = MarkupContent = {}));
      var CompletionItemKind;
      (function(CompletionItemKind2) {
        CompletionItemKind2.Text = 1;
        CompletionItemKind2.Method = 2;
        CompletionItemKind2.Function = 3;
        CompletionItemKind2.Constructor = 4;
        CompletionItemKind2.Field = 5;
        CompletionItemKind2.Variable = 6;
        CompletionItemKind2.Class = 7;
        CompletionItemKind2.Interface = 8;
        CompletionItemKind2.Module = 9;
        CompletionItemKind2.Property = 10;
        CompletionItemKind2.Unit = 11;
        CompletionItemKind2.Value = 12;
        CompletionItemKind2.Enum = 13;
        CompletionItemKind2.Keyword = 14;
        CompletionItemKind2.Snippet = 15;
        CompletionItemKind2.Color = 16;
        CompletionItemKind2.File = 17;
        CompletionItemKind2.Reference = 18;
        CompletionItemKind2.Folder = 19;
        CompletionItemKind2.EnumMember = 20;
        CompletionItemKind2.Constant = 21;
        CompletionItemKind2.Struct = 22;
        CompletionItemKind2.Event = 23;
        CompletionItemKind2.Operator = 24;
        CompletionItemKind2.TypeParameter = 25;
      })(CompletionItemKind || (exports3.CompletionItemKind = CompletionItemKind = {}));
      var InsertTextFormat;
      (function(InsertTextFormat2) {
        InsertTextFormat2.PlainText = 1;
        InsertTextFormat2.Snippet = 2;
      })(InsertTextFormat || (exports3.InsertTextFormat = InsertTextFormat = {}));
      var CompletionItemTag;
      (function(CompletionItemTag2) {
        CompletionItemTag2.Deprecated = 1;
      })(CompletionItemTag || (exports3.CompletionItemTag = CompletionItemTag = {}));
      var InsertReplaceEdit;
      (function(InsertReplaceEdit2) {
        function create(newText, insert, replace) {
          return { newText, insert, replace };
        }
        __name(create, "create");
        InsertReplaceEdit2.create = create;
        function is(value) {
          var candidate = value;
          return candidate && Is.string(candidate.newText) && Range.is(candidate.insert) && Range.is(candidate.replace);
        }
        __name(is, "is");
        InsertReplaceEdit2.is = is;
      })(InsertReplaceEdit || (exports3.InsertReplaceEdit = InsertReplaceEdit = {}));
      var InsertTextMode;
      (function(InsertTextMode2) {
        InsertTextMode2.asIs = 1;
        InsertTextMode2.adjustIndentation = 2;
      })(InsertTextMode || (exports3.InsertTextMode = InsertTextMode = {}));
      var CompletionItemLabelDetails;
      (function(CompletionItemLabelDetails2) {
        function is(value) {
          var candidate = value;
          return candidate && (Is.string(candidate.detail) || candidate.detail === void 0) && (Is.string(candidate.description) || candidate.description === void 0);
        }
        __name(is, "is");
        CompletionItemLabelDetails2.is = is;
      })(CompletionItemLabelDetails || (exports3.CompletionItemLabelDetails = CompletionItemLabelDetails = {}));
      var CompletionItem;
      (function(CompletionItem2) {
        function create(label) {
          return { label };
        }
        __name(create, "create");
        CompletionItem2.create = create;
      })(CompletionItem || (exports3.CompletionItem = CompletionItem = {}));
      var CompletionList;
      (function(CompletionList2) {
        function create(items, isIncomplete) {
          return { items: items ? items : [], isIncomplete: !!isIncomplete };
        }
        __name(create, "create");
        CompletionList2.create = create;
      })(CompletionList || (exports3.CompletionList = CompletionList = {}));
      var MarkedString;
      (function(MarkedString2) {
        function fromPlainText(plainText) {
          return plainText.replace(/[\\`*_{}[\]()#+\-.!]/g, "\\$&");
        }
        __name(fromPlainText, "fromPlainText");
        MarkedString2.fromPlainText = fromPlainText;
        function is(value) {
          var candidate = value;
          return Is.string(candidate) || Is.objectLiteral(candidate) && Is.string(candidate.language) && Is.string(candidate.value);
        }
        __name(is, "is");
        MarkedString2.is = is;
      })(MarkedString || (exports3.MarkedString = MarkedString = {}));
      var Hover;
      (function(Hover2) {
        function is(value) {
          var candidate = value;
          return !!candidate && Is.objectLiteral(candidate) && (MarkupContent.is(candidate.contents) || MarkedString.is(candidate.contents) || Is.typedArray(candidate.contents, MarkedString.is)) && (value.range === void 0 || Range.is(value.range));
        }
        __name(is, "is");
        Hover2.is = is;
      })(Hover || (exports3.Hover = Hover = {}));
      var ParameterInformation;
      (function(ParameterInformation2) {
        function create(label, documentation) {
          return documentation ? { label, documentation } : { label };
        }
        __name(create, "create");
        ParameterInformation2.create = create;
      })(ParameterInformation || (exports3.ParameterInformation = ParameterInformation = {}));
      var SignatureInformation;
      (function(SignatureInformation2) {
        function create(label, documentation) {
          var parameters = [];
          for (var _i = 2; _i < arguments.length; _i++) {
            parameters[_i - 2] = arguments[_i];
          }
          var result = { label };
          if (Is.defined(documentation)) {
            result.documentation = documentation;
          }
          if (Is.defined(parameters)) {
            result.parameters = parameters;
          } else {
            result.parameters = [];
          }
          return result;
        }
        __name(create, "create");
        SignatureInformation2.create = create;
      })(SignatureInformation || (exports3.SignatureInformation = SignatureInformation = {}));
      var DocumentHighlightKind;
      (function(DocumentHighlightKind2) {
        DocumentHighlightKind2.Text = 1;
        DocumentHighlightKind2.Read = 2;
        DocumentHighlightKind2.Write = 3;
      })(DocumentHighlightKind || (exports3.DocumentHighlightKind = DocumentHighlightKind = {}));
      var DocumentHighlight;
      (function(DocumentHighlight2) {
        function create(range, kind) {
          var result = { range };
          if (Is.number(kind)) {
            result.kind = kind;
          }
          return result;
        }
        __name(create, "create");
        DocumentHighlight2.create = create;
      })(DocumentHighlight || (exports3.DocumentHighlight = DocumentHighlight = {}));
      var SymbolKind;
      (function(SymbolKind2) {
        SymbolKind2.File = 1;
        SymbolKind2.Module = 2;
        SymbolKind2.Namespace = 3;
        SymbolKind2.Package = 4;
        SymbolKind2.Class = 5;
        SymbolKind2.Method = 6;
        SymbolKind2.Property = 7;
        SymbolKind2.Field = 8;
        SymbolKind2.Constructor = 9;
        SymbolKind2.Enum = 10;
        SymbolKind2.Interface = 11;
        SymbolKind2.Function = 12;
        SymbolKind2.Variable = 13;
        SymbolKind2.Constant = 14;
        SymbolKind2.String = 15;
        SymbolKind2.Number = 16;
        SymbolKind2.Boolean = 17;
        SymbolKind2.Array = 18;
        SymbolKind2.Object = 19;
        SymbolKind2.Key = 20;
        SymbolKind2.Null = 21;
        SymbolKind2.EnumMember = 22;
        SymbolKind2.Struct = 23;
        SymbolKind2.Event = 24;
        SymbolKind2.Operator = 25;
        SymbolKind2.TypeParameter = 26;
      })(SymbolKind || (exports3.SymbolKind = SymbolKind = {}));
      var SymbolTag;
      (function(SymbolTag2) {
        SymbolTag2.Deprecated = 1;
      })(SymbolTag || (exports3.SymbolTag = SymbolTag = {}));
      var SymbolInformation;
      (function(SymbolInformation2) {
        function create(name, kind, range, uri, containerName) {
          var result = {
            name,
            kind,
            location: { uri, range }
          };
          if (containerName) {
            result.containerName = containerName;
          }
          return result;
        }
        __name(create, "create");
        SymbolInformation2.create = create;
      })(SymbolInformation || (exports3.SymbolInformation = SymbolInformation = {}));
      var WorkspaceSymbol;
      (function(WorkspaceSymbol2) {
        function create(name, kind, uri, range) {
          return range !== void 0 ? { name, kind, location: { uri, range } } : { name, kind, location: { uri } };
        }
        __name(create, "create");
        WorkspaceSymbol2.create = create;
      })(WorkspaceSymbol || (exports3.WorkspaceSymbol = WorkspaceSymbol = {}));
      var DocumentSymbol;
      (function(DocumentSymbol2) {
        function create(name, detail, kind, range, selectionRange, children) {
          var result = {
            name,
            detail,
            kind,
            range,
            selectionRange
          };
          if (children !== void 0) {
            result.children = children;
          }
          return result;
        }
        __name(create, "create");
        DocumentSymbol2.create = create;
        function is(value) {
          var candidate = value;
          return candidate && Is.string(candidate.name) && Is.number(candidate.kind) && Range.is(candidate.range) && Range.is(candidate.selectionRange) && (candidate.detail === void 0 || Is.string(candidate.detail)) && (candidate.deprecated === void 0 || Is.boolean(candidate.deprecated)) && (candidate.children === void 0 || Array.isArray(candidate.children)) && (candidate.tags === void 0 || Array.isArray(candidate.tags));
        }
        __name(is, "is");
        DocumentSymbol2.is = is;
      })(DocumentSymbol || (exports3.DocumentSymbol = DocumentSymbol = {}));
      var CodeActionKind;
      (function(CodeActionKind2) {
        CodeActionKind2.Empty = "";
        CodeActionKind2.QuickFix = "quickfix";
        CodeActionKind2.Refactor = "refactor";
        CodeActionKind2.RefactorExtract = "refactor.extract";
        CodeActionKind2.RefactorInline = "refactor.inline";
        CodeActionKind2.RefactorRewrite = "refactor.rewrite";
        CodeActionKind2.Source = "source";
        CodeActionKind2.SourceOrganizeImports = "source.organizeImports";
        CodeActionKind2.SourceFixAll = "source.fixAll";
      })(CodeActionKind || (exports3.CodeActionKind = CodeActionKind = {}));
      var CodeActionTriggerKind;
      (function(CodeActionTriggerKind2) {
        CodeActionTriggerKind2.Invoked = 1;
        CodeActionTriggerKind2.Automatic = 2;
      })(CodeActionTriggerKind || (exports3.CodeActionTriggerKind = CodeActionTriggerKind = {}));
      var CodeActionContext;
      (function(CodeActionContext2) {
        function create(diagnostics, only, triggerKind) {
          var result = { diagnostics };
          if (only !== void 0 && only !== null) {
            result.only = only;
          }
          if (triggerKind !== void 0 && triggerKind !== null) {
            result.triggerKind = triggerKind;
          }
          return result;
        }
        __name(create, "create");
        CodeActionContext2.create = create;
        function is(value) {
          var candidate = value;
          return Is.defined(candidate) && Is.typedArray(candidate.diagnostics, Diagnostic.is) && (candidate.only === void 0 || Is.typedArray(candidate.only, Is.string)) && (candidate.triggerKind === void 0 || candidate.triggerKind === CodeActionTriggerKind.Invoked || candidate.triggerKind === CodeActionTriggerKind.Automatic);
        }
        __name(is, "is");
        CodeActionContext2.is = is;
      })(CodeActionContext || (exports3.CodeActionContext = CodeActionContext = {}));
      var CodeAction;
      (function(CodeAction2) {
        function create(title, kindOrCommandOrEdit, kind) {
          var result = { title };
          var checkKind = true;
          if (typeof kindOrCommandOrEdit === "string") {
            checkKind = false;
            result.kind = kindOrCommandOrEdit;
          } else if (Command.is(kindOrCommandOrEdit)) {
            result.command = kindOrCommandOrEdit;
          } else {
            result.edit = kindOrCommandOrEdit;
          }
          if (checkKind && kind !== void 0) {
            result.kind = kind;
          }
          return result;
        }
        __name(create, "create");
        CodeAction2.create = create;
        function is(value) {
          var candidate = value;
          return candidate && Is.string(candidate.title) && (candidate.diagnostics === void 0 || Is.typedArray(candidate.diagnostics, Diagnostic.is)) && (candidate.kind === void 0 || Is.string(candidate.kind)) && (candidate.edit !== void 0 || candidate.command !== void 0) && (candidate.command === void 0 || Command.is(candidate.command)) && (candidate.isPreferred === void 0 || Is.boolean(candidate.isPreferred)) && (candidate.edit === void 0 || WorkspaceEdit.is(candidate.edit));
        }
        __name(is, "is");
        CodeAction2.is = is;
      })(CodeAction || (exports3.CodeAction = CodeAction = {}));
      var CodeLens;
      (function(CodeLens2) {
        function create(range, data) {
          var result = { range };
          if (Is.defined(data)) {
            result.data = data;
          }
          return result;
        }
        __name(create, "create");
        CodeLens2.create = create;
        function is(value) {
          var candidate = value;
          return Is.defined(candidate) && Range.is(candidate.range) && (Is.undefined(candidate.command) || Command.is(candidate.command));
        }
        __name(is, "is");
        CodeLens2.is = is;
      })(CodeLens || (exports3.CodeLens = CodeLens = {}));
      var FormattingOptions;
      (function(FormattingOptions2) {
        function create(tabSize, insertSpaces) {
          return { tabSize, insertSpaces };
        }
        __name(create, "create");
        FormattingOptions2.create = create;
        function is(value) {
          var candidate = value;
          return Is.defined(candidate) && Is.uinteger(candidate.tabSize) && Is.boolean(candidate.insertSpaces);
        }
        __name(is, "is");
        FormattingOptions2.is = is;
      })(FormattingOptions || (exports3.FormattingOptions = FormattingOptions = {}));
      var DocumentLink;
      (function(DocumentLink2) {
        function create(range, target, data) {
          return { range, target, data };
        }
        __name(create, "create");
        DocumentLink2.create = create;
        function is(value) {
          var candidate = value;
          return Is.defined(candidate) && Range.is(candidate.range) && (Is.undefined(candidate.target) || Is.string(candidate.target));
        }
        __name(is, "is");
        DocumentLink2.is = is;
      })(DocumentLink || (exports3.DocumentLink = DocumentLink = {}));
      var SelectionRange;
      (function(SelectionRange2) {
        function create(range, parent) {
          return { range, parent };
        }
        __name(create, "create");
        SelectionRange2.create = create;
        function is(value) {
          var candidate = value;
          return Is.objectLiteral(candidate) && Range.is(candidate.range) && (candidate.parent === void 0 || SelectionRange2.is(candidate.parent));
        }
        __name(is, "is");
        SelectionRange2.is = is;
      })(SelectionRange || (exports3.SelectionRange = SelectionRange = {}));
      var SemanticTokenTypes;
      (function(SemanticTokenTypes2) {
        SemanticTokenTypes2["namespace"] = "namespace";
        SemanticTokenTypes2["type"] = "type";
        SemanticTokenTypes2["class"] = "class";
        SemanticTokenTypes2["enum"] = "enum";
        SemanticTokenTypes2["interface"] = "interface";
        SemanticTokenTypes2["struct"] = "struct";
        SemanticTokenTypes2["typeParameter"] = "typeParameter";
        SemanticTokenTypes2["parameter"] = "parameter";
        SemanticTokenTypes2["variable"] = "variable";
        SemanticTokenTypes2["property"] = "property";
        SemanticTokenTypes2["enumMember"] = "enumMember";
        SemanticTokenTypes2["event"] = "event";
        SemanticTokenTypes2["function"] = "function";
        SemanticTokenTypes2["method"] = "method";
        SemanticTokenTypes2["macro"] = "macro";
        SemanticTokenTypes2["keyword"] = "keyword";
        SemanticTokenTypes2["modifier"] = "modifier";
        SemanticTokenTypes2["comment"] = "comment";
        SemanticTokenTypes2["string"] = "string";
        SemanticTokenTypes2["number"] = "number";
        SemanticTokenTypes2["regexp"] = "regexp";
        SemanticTokenTypes2["operator"] = "operator";
        SemanticTokenTypes2["decorator"] = "decorator";
      })(SemanticTokenTypes || (exports3.SemanticTokenTypes = SemanticTokenTypes = {}));
      var SemanticTokenModifiers;
      (function(SemanticTokenModifiers2) {
        SemanticTokenModifiers2["declaration"] = "declaration";
        SemanticTokenModifiers2["definition"] = "definition";
        SemanticTokenModifiers2["readonly"] = "readonly";
        SemanticTokenModifiers2["static"] = "static";
        SemanticTokenModifiers2["deprecated"] = "deprecated";
        SemanticTokenModifiers2["abstract"] = "abstract";
        SemanticTokenModifiers2["async"] = "async";
        SemanticTokenModifiers2["modification"] = "modification";
        SemanticTokenModifiers2["documentation"] = "documentation";
        SemanticTokenModifiers2["defaultLibrary"] = "defaultLibrary";
      })(SemanticTokenModifiers || (exports3.SemanticTokenModifiers = SemanticTokenModifiers = {}));
      var SemanticTokens;
      (function(SemanticTokens2) {
        function is(value) {
          var candidate = value;
          return Is.objectLiteral(candidate) && (candidate.resultId === void 0 || typeof candidate.resultId === "string") && Array.isArray(candidate.data) && (candidate.data.length === 0 || typeof candidate.data[0] === "number");
        }
        __name(is, "is");
        SemanticTokens2.is = is;
      })(SemanticTokens || (exports3.SemanticTokens = SemanticTokens = {}));
      var InlineValueText;
      (function(InlineValueText2) {
        function create(range, text) {
          return { range, text };
        }
        __name(create, "create");
        InlineValueText2.create = create;
        function is(value) {
          var candidate = value;
          return candidate !== void 0 && candidate !== null && Range.is(candidate.range) && Is.string(candidate.text);
        }
        __name(is, "is");
        InlineValueText2.is = is;
      })(InlineValueText || (exports3.InlineValueText = InlineValueText = {}));
      var InlineValueVariableLookup;
      (function(InlineValueVariableLookup2) {
        function create(range, variableName, caseSensitiveLookup) {
          return { range, variableName, caseSensitiveLookup };
        }
        __name(create, "create");
        InlineValueVariableLookup2.create = create;
        function is(value) {
          var candidate = value;
          return candidate !== void 0 && candidate !== null && Range.is(candidate.range) && Is.boolean(candidate.caseSensitiveLookup) && (Is.string(candidate.variableName) || candidate.variableName === void 0);
        }
        __name(is, "is");
        InlineValueVariableLookup2.is = is;
      })(InlineValueVariableLookup || (exports3.InlineValueVariableLookup = InlineValueVariableLookup = {}));
      var InlineValueEvaluatableExpression;
      (function(InlineValueEvaluatableExpression2) {
        function create(range, expression) {
          return { range, expression };
        }
        __name(create, "create");
        InlineValueEvaluatableExpression2.create = create;
        function is(value) {
          var candidate = value;
          return candidate !== void 0 && candidate !== null && Range.is(candidate.range) && (Is.string(candidate.expression) || candidate.expression === void 0);
        }
        __name(is, "is");
        InlineValueEvaluatableExpression2.is = is;
      })(InlineValueEvaluatableExpression || (exports3.InlineValueEvaluatableExpression = InlineValueEvaluatableExpression = {}));
      var InlineValueContext;
      (function(InlineValueContext2) {
        function create(frameId, stoppedLocation) {
          return { frameId, stoppedLocation };
        }
        __name(create, "create");
        InlineValueContext2.create = create;
        function is(value) {
          var candidate = value;
          return Is.defined(candidate) && Range.is(value.stoppedLocation);
        }
        __name(is, "is");
        InlineValueContext2.is = is;
      })(InlineValueContext || (exports3.InlineValueContext = InlineValueContext = {}));
      var InlayHintKind;
      (function(InlayHintKind2) {
        InlayHintKind2.Type = 1;
        InlayHintKind2.Parameter = 2;
        function is(value) {
          return value === 1 || value === 2;
        }
        __name(is, "is");
        InlayHintKind2.is = is;
      })(InlayHintKind || (exports3.InlayHintKind = InlayHintKind = {}));
      var InlayHintLabelPart;
      (function(InlayHintLabelPart2) {
        function create(value) {
          return { value };
        }
        __name(create, "create");
        InlayHintLabelPart2.create = create;
        function is(value) {
          var candidate = value;
          return Is.objectLiteral(candidate) && (candidate.tooltip === void 0 || Is.string(candidate.tooltip) || MarkupContent.is(candidate.tooltip)) && (candidate.location === void 0 || Location.is(candidate.location)) && (candidate.command === void 0 || Command.is(candidate.command));
        }
        __name(is, "is");
        InlayHintLabelPart2.is = is;
      })(InlayHintLabelPart || (exports3.InlayHintLabelPart = InlayHintLabelPart = {}));
      var InlayHint;
      (function(InlayHint2) {
        function create(position, label, kind) {
          var result = { position, label };
          if (kind !== void 0) {
            result.kind = kind;
          }
          return result;
        }
        __name(create, "create");
        InlayHint2.create = create;
        function is(value) {
          var candidate = value;
          return Is.objectLiteral(candidate) && Position.is(candidate.position) && (Is.string(candidate.label) || Is.typedArray(candidate.label, InlayHintLabelPart.is)) && (candidate.kind === void 0 || InlayHintKind.is(candidate.kind)) && candidate.textEdits === void 0 || Is.typedArray(candidate.textEdits, TextEdit.is) && (candidate.tooltip === void 0 || Is.string(candidate.tooltip) || MarkupContent.is(candidate.tooltip)) && (candidate.paddingLeft === void 0 || Is.boolean(candidate.paddingLeft)) && (candidate.paddingRight === void 0 || Is.boolean(candidate.paddingRight));
        }
        __name(is, "is");
        InlayHint2.is = is;
      })(InlayHint || (exports3.InlayHint = InlayHint = {}));
      var StringValue;
      (function(StringValue2) {
        function createSnippet(value) {
          return { kind: "snippet", value };
        }
        __name(createSnippet, "createSnippet");
        StringValue2.createSnippet = createSnippet;
      })(StringValue || (exports3.StringValue = StringValue = {}));
      var InlineCompletionItem;
      (function(InlineCompletionItem2) {
        function create(insertText, filterText, range, command) {
          return { insertText, filterText, range, command };
        }
        __name(create, "create");
        InlineCompletionItem2.create = create;
      })(InlineCompletionItem || (exports3.InlineCompletionItem = InlineCompletionItem = {}));
      var InlineCompletionList;
      (function(InlineCompletionList2) {
        function create(items) {
          return { items };
        }
        __name(create, "create");
        InlineCompletionList2.create = create;
      })(InlineCompletionList || (exports3.InlineCompletionList = InlineCompletionList = {}));
      var InlineCompletionTriggerKind;
      (function(InlineCompletionTriggerKind2) {
        InlineCompletionTriggerKind2.Invoked = 0;
        InlineCompletionTriggerKind2.Automatic = 1;
      })(InlineCompletionTriggerKind || (exports3.InlineCompletionTriggerKind = InlineCompletionTriggerKind = {}));
      var SelectedCompletionInfo;
      (function(SelectedCompletionInfo2) {
        function create(range, text) {
          return { range, text };
        }
        __name(create, "create");
        SelectedCompletionInfo2.create = create;
      })(SelectedCompletionInfo || (exports3.SelectedCompletionInfo = SelectedCompletionInfo = {}));
      var InlineCompletionContext;
      (function(InlineCompletionContext2) {
        function create(triggerKind, selectedCompletionInfo) {
          return { triggerKind, selectedCompletionInfo };
        }
        __name(create, "create");
        InlineCompletionContext2.create = create;
      })(InlineCompletionContext || (exports3.InlineCompletionContext = InlineCompletionContext = {}));
      var WorkspaceFolder;
      (function(WorkspaceFolder2) {
        function is(value) {
          var candidate = value;
          return Is.objectLiteral(candidate) && URI.is(candidate.uri) && Is.string(candidate.name);
        }
        __name(is, "is");
        WorkspaceFolder2.is = is;
      })(WorkspaceFolder || (exports3.WorkspaceFolder = WorkspaceFolder = {}));
      exports3.EOL = ["\n", "\r\n", "\r"];
      var TextDocument;
      (function(TextDocument2) {
        function create(uri, languageId, version, content) {
          return new FullTextDocument(uri, languageId, version, content);
        }
        __name(create, "create");
        TextDocument2.create = create;
        function is(value) {
          var candidate = value;
          return Is.defined(candidate) && Is.string(candidate.uri) && (Is.undefined(candidate.languageId) || Is.string(candidate.languageId)) && Is.uinteger(candidate.lineCount) && Is.func(candidate.getText) && Is.func(candidate.positionAt) && Is.func(candidate.offsetAt) ? true : false;
        }
        __name(is, "is");
        TextDocument2.is = is;
        function applyEdits(document, edits) {
          var text = document.getText();
          var sortedEdits = mergeSort(edits, function(a, b) {
            var diff = a.range.start.line - b.range.start.line;
            if (diff === 0) {
              return a.range.start.character - b.range.start.character;
            }
            return diff;
          });
          var lastModifiedOffset = text.length;
          for (var i = sortedEdits.length - 1; i >= 0; i--) {
            var e = sortedEdits[i];
            var startOffset = document.offsetAt(e.range.start);
            var endOffset = document.offsetAt(e.range.end);
            if (endOffset <= lastModifiedOffset) {
              text = text.substring(0, startOffset) + e.newText + text.substring(endOffset, text.length);
            } else {
              throw new Error("Overlapping edit");
            }
            lastModifiedOffset = startOffset;
          }
          return text;
        }
        __name(applyEdits, "applyEdits");
        TextDocument2.applyEdits = applyEdits;
        function mergeSort(data, compare) {
          if (data.length <= 1) {
            return data;
          }
          var p = data.length / 2 | 0;
          var left = data.slice(0, p);
          var right = data.slice(p);
          mergeSort(left, compare);
          mergeSort(right, compare);
          var leftIdx = 0;
          var rightIdx = 0;
          var i = 0;
          while (leftIdx < left.length && rightIdx < right.length) {
            var ret = compare(left[leftIdx], right[rightIdx]);
            if (ret <= 0) {
              data[i++] = left[leftIdx++];
            } else {
              data[i++] = right[rightIdx++];
            }
          }
          while (leftIdx < left.length) {
            data[i++] = left[leftIdx++];
          }
          while (rightIdx < right.length) {
            data[i++] = right[rightIdx++];
          }
          return data;
        }
        __name(mergeSort, "mergeSort");
      })(TextDocument || (exports3.TextDocument = TextDocument = {}));
      var FullTextDocument = (
        /** @class */
        (function() {
          function FullTextDocument2(uri, languageId, version, content) {
            this._uri = uri;
            this._languageId = languageId;
            this._version = version;
            this._content = content;
            this._lineOffsets = void 0;
          }
          __name(FullTextDocument2, "FullTextDocument");
          Object.defineProperty(FullTextDocument2.prototype, "uri", {
            get: /* @__PURE__ */ __name(function() {
              return this._uri;
            }, "get"),
            enumerable: false,
            configurable: true
          });
          Object.defineProperty(FullTextDocument2.prototype, "languageId", {
            get: /* @__PURE__ */ __name(function() {
              return this._languageId;
            }, "get"),
            enumerable: false,
            configurable: true
          });
          Object.defineProperty(FullTextDocument2.prototype, "version", {
            get: /* @__PURE__ */ __name(function() {
              return this._version;
            }, "get"),
            enumerable: false,
            configurable: true
          });
          FullTextDocument2.prototype.getText = function(range) {
            if (range) {
              var start = this.offsetAt(range.start);
              var end = this.offsetAt(range.end);
              return this._content.substring(start, end);
            }
            return this._content;
          };
          FullTextDocument2.prototype.update = function(event, version) {
            this._content = event.text;
            this._version = version;
            this._lineOffsets = void 0;
          };
          FullTextDocument2.prototype.getLineOffsets = function() {
            if (this._lineOffsets === void 0) {
              var lineOffsets = [];
              var text = this._content;
              var isLineStart = true;
              for (var i = 0; i < text.length; i++) {
                if (isLineStart) {
                  lineOffsets.push(i);
                  isLineStart = false;
                }
                var ch = text.charAt(i);
                isLineStart = ch === "\r" || ch === "\n";
                if (ch === "\r" && i + 1 < text.length && text.charAt(i + 1) === "\n") {
                  i++;
                }
              }
              if (isLineStart && text.length > 0) {
                lineOffsets.push(text.length);
              }
              this._lineOffsets = lineOffsets;
            }
            return this._lineOffsets;
          };
          FullTextDocument2.prototype.positionAt = function(offset) {
            offset = Math.max(Math.min(offset, this._content.length), 0);
            var lineOffsets = this.getLineOffsets();
            var low = 0, high = lineOffsets.length;
            if (high === 0) {
              return Position.create(0, offset);
            }
            while (low < high) {
              var mid = Math.floor((low + high) / 2);
              if (lineOffsets[mid] > offset) {
                high = mid;
              } else {
                low = mid + 1;
              }
            }
            var line = low - 1;
            return Position.create(line, offset - lineOffsets[line]);
          };
          FullTextDocument2.prototype.offsetAt = function(position) {
            var lineOffsets = this.getLineOffsets();
            if (position.line >= lineOffsets.length) {
              return this._content.length;
            } else if (position.line < 0) {
              return 0;
            }
            var lineOffset = lineOffsets[position.line];
            var nextLineOffset = position.line + 1 < lineOffsets.length ? lineOffsets[position.line + 1] : this._content.length;
            return Math.max(Math.min(lineOffset + position.character, nextLineOffset), lineOffset);
          };
          Object.defineProperty(FullTextDocument2.prototype, "lineCount", {
            get: /* @__PURE__ */ __name(function() {
              return this.getLineOffsets().length;
            }, "get"),
            enumerable: false,
            configurable: true
          });
          return FullTextDocument2;
        })()
      );
      var Is;
      (function(Is2) {
        var toString = Object.prototype.toString;
        function defined(value) {
          return typeof value !== "undefined";
        }
        __name(defined, "defined");
        Is2.defined = defined;
        function undefined2(value) {
          return typeof value === "undefined";
        }
        __name(undefined2, "undefined");
        Is2.undefined = undefined2;
        function boolean(value) {
          return value === true || value === false;
        }
        __name(boolean, "boolean");
        Is2.boolean = boolean;
        function string(value) {
          return toString.call(value) === "[object String]";
        }
        __name(string, "string");
        Is2.string = string;
        function number(value) {
          return toString.call(value) === "[object Number]";
        }
        __name(number, "number");
        Is2.number = number;
        function numberRange(value, min, max) {
          return toString.call(value) === "[object Number]" && min <= value && value <= max;
        }
        __name(numberRange, "numberRange");
        Is2.numberRange = numberRange;
        function integer2(value) {
          return toString.call(value) === "[object Number]" && -2147483648 <= value && value <= 2147483647;
        }
        __name(integer2, "integer");
        Is2.integer = integer2;
        function uinteger2(value) {
          return toString.call(value) === "[object Number]" && 0 <= value && value <= 2147483647;
        }
        __name(uinteger2, "uinteger");
        Is2.uinteger = uinteger2;
        function func(value) {
          return toString.call(value) === "[object Function]";
        }
        __name(func, "func");
        Is2.func = func;
        function objectLiteral(value) {
          return value !== null && typeof value === "object";
        }
        __name(objectLiteral, "objectLiteral");
        Is2.objectLiteral = objectLiteral;
        function typedArray(value, check) {
          return Array.isArray(value) && value.every(check);
        }
        __name(typedArray, "typedArray");
        Is2.typedArray = typedArray;
      })(Is || (Is = {}));
    });
  }
});

// build/server/utils/documents/create-text-edits.js
var require_create_text_edits = __commonJS({
  "build/server/utils/documents/create-text-edits.js"(exports2) {
    "use strict";
    var __importDefault2 = exports2 && exports2.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.createTextEdits = createTextEdits;
    var fast_diff_1 = __importDefault2(require_diff());
    var vscode_languageserver_types_1 = require_main();
    function createTextEdits(document, newContents) {
      const diffs = (0, fast_diff_1.default)(document.getText(), newContents);
      const edits = [];
      let offset = 0;
      for (const [op, text] of diffs) {
        const start = offset;
        switch (op) {
          case fast_diff_1.default.EQUAL:
            offset += text.length;
            break;
          case fast_diff_1.default.DELETE:
            offset += text.length;
            edits.push(vscode_languageserver_types_1.TextEdit.del(vscode_languageserver_types_1.Range.create(document.positionAt(start), document.positionAt(offset))));
            break;
          case fast_diff_1.default.INSERT:
            edits.push(vscode_languageserver_types_1.TextEdit.insert(document.positionAt(start), text));
            break;
        }
      }
      return edits;
    }
    __name(createTextEdits, "createTextEdits");
  }
});

// build/server/utils/documents/get-edit-info.js
var require_get_edit_info = __commonJS({
  "build/server/utils/documents/get-edit-info.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getEditInfo = getEditInfo;
    function getEditInfo(document, diagnostic, lintResult) {
      if (!lintResult || document.version !== lintResult.version) {
        return void 0;
      }
      const warning = lintResult.getWarning?.(diagnostic);
      if (!warning) {
        return void 0;
      }
      const edit = warning.fix;
      if (!edit) {
        return void 0;
      }
      return {
        label: `Fix this ${warning.rule} problem`,
        edit: {
          newText: edit.text,
          range: {
            start: document.positionAt(edit.range[0]),
            end: document.positionAt(edit.range[1])
          }
        }
      };
    }
    __name(getEditInfo, "getEditInfo");
  }
});

// build/server/utils/documents/get-disable-type.js
var require_get_disable_type = __commonJS({
  "build/server/utils/documents/get-disable-type.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getDisableType = getDisableType;
    var vscode_languageserver_types_1 = require_main();
    function getDisableType(document, position) {
      const lineStartOffset = document.offsetAt(vscode_languageserver_types_1.Position.create(position.line, 0));
      const lineEndOffset = document.offsetAt(vscode_languageserver_types_1.Position.create(position.line + 1, 0));
      const line = document.getText().slice(lineStartOffset, lineEndOffset);
      const before = line.slice(0, position.character);
      const after = line.slice(position.character);
      const disableKind = before.match(/\/\*\s*(stylelint-disable(?:(?:-next)?-line)?)\s[a-z\-/\s,]*$/i)?.[1]?.toLowerCase();
      return disableKind && /^[a-z\-/\s,]*\*\//i.test(after) ? disableKind : void 0;
    }
    __name(getDisableType, "getDisableType");
  }
});

// build/server/utils/documents/get-fixes.js
var require_get_fixes = __commonJS({
  "build/server/utils/documents/get-fixes.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getFixes = getFixes;
    var create_text_edits_js_1 = require_create_text_edits();
    async function getFixes(runner, document, linterOptions = {}, runnerOptions = {}) {
      const result = await runner.lintDocument(document, { ...linterOptions, fix: true }, runnerOptions);
      const fixedCode = typeof result.code === "string" ? result.code : typeof result.output === "string" && result.output.length > 0 ? result.output : void 0;
      return typeof fixedCode === "string" ? (0, create_text_edits_js_1.createTextEdits)(document, fixedCode) : [];
    }
    __name(getFixes, "getFixes");
  }
});

// build/server/utils/documents/index.js
var require_documents = __commonJS({
  "build/server/utils/documents/index.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: /* @__PURE__ */ __name(function() {
          return m[k];
        }, "get") };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports2 && exports2.__exportStar || function(m, exports3) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p)) __createBinding(exports3, m, p);
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    __exportStar(require_create_text_edits(), exports2);
    __exportStar(require_get_edit_info(), exports2);
    __exportStar(require_get_disable_type(), exports2);
    __exportStar(require_get_fixes(), exports2);
  }
});

// build/server/utils/functions/get-first-return-value.js
var require_get_first_return_value = __commonJS({
  "build/server/utils/functions/get-first-return-value.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getFirstReturnValue = getFirstReturnValue;
    exports2.getFirstResolvedValue = getFirstResolvedValue;
    function getFirstReturnValue(...functions) {
      for (const func of functions) {
        const result = func();
        if (result !== void 0) {
          return result;
        }
      }
      return void 0;
    }
    __name(getFirstReturnValue, "getFirstReturnValue");
    async function getFirstResolvedValue(...functions) {
      for (const func of functions) {
        const result = await func();
        if (result !== void 0) {
          return result;
        }
      }
      return void 0;
    }
    __name(getFirstResolvedValue, "getFirstResolvedValue");
  }
});

// build/server/utils/functions/lazy-call.js
var require_lazy_call = __commonJS({
  "build/server/utils/functions/lazy-call.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.lazyCall = lazyCall;
    exports2.lazyCallAsync = lazyCallAsync;
    function lazyCall(inner) {
      let cached = false;
      let cache;
      return () => {
        if (!cached) {
          cache = inner();
          cached = true;
        }
        return cache;
      };
    }
    __name(lazyCall, "lazyCall");
    function lazyCallAsync(inner) {
      let cached = false;
      let cache;
      return async () => {
        if (!cached) {
          cache = await inner();
          cached = true;
        }
        return cache;
      };
    }
    __name(lazyCallAsync, "lazyCallAsync");
  }
});

// build/server/utils/functions/index.js
var require_functions = __commonJS({
  "build/server/utils/functions/index.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: /* @__PURE__ */ __name(function() {
          return m[k];
        }, "get") };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports2 && exports2.__exportStar || function(m, exports3) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p)) __createBinding(exports3, m, p);
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    __exportStar(require_get_first_return_value(), exports2);
    __exportStar(require_lazy_call(), exports2);
  }
});

// node_modules/non-error/index.js
function defineProperty(object, key, value) {
  Object.defineProperty(object, key, {
    value,
    writable: false,
    enumerable: false,
    configurable: false
  });
}
function stringify(value) {
  if (value === void 0) {
    return "undefined";
  }
  if (value === null) {
    return "null";
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (typeof value === "bigint") {
    return `${value}n`;
  }
  if (typeof value === "symbol") {
    return value.toString();
  }
  if (typeof value === "function") {
    return `[Function${value.name ? ` ${value.name}` : " (anonymous)"}]`;
  }
  if (value instanceof Error) {
    try {
      return String(value);
    } catch {
      return "<Unserializable error>";
    }
  }
  try {
    return JSON.stringify(value);
  } catch {
    try {
      return String(value);
    } catch {
      return "<Unserializable value>";
    }
  }
}
var isNonErrorSymbol, NonError;
var init_non_error = __esm({
  "node_modules/non-error/index.js"() {
    isNonErrorSymbol = /* @__PURE__ */ Symbol("isNonError");
    __name(defineProperty, "defineProperty");
    __name(stringify, "stringify");
    NonError = class _NonError extends Error {
      static {
        __name(this, "NonError");
      }
      constructor(value, { superclass: Superclass = Error } = {}) {
        if (_NonError.isNonError(value)) {
          return value;
        }
        if (value instanceof Error) {
          throw new TypeError("Do not pass Error instances to NonError. Throw the error directly instead.");
        }
        super(`Non-error value: ${stringify(value)}`);
        if (Superclass !== Error) {
          Object.setPrototypeOf(this, Superclass.prototype);
        }
        defineProperty(this, "name", "NonError");
        defineProperty(this, isNonErrorSymbol, true);
        defineProperty(this, "isNonError", true);
        defineProperty(this, "value", value);
      }
      static isNonError(value) {
        return value?.[isNonErrorSymbol] === true;
      }
      static #handleCallback(callback, arguments_) {
        try {
          const result = callback(...arguments_);
          if (result && typeof result.then === "function") {
            return (async () => {
              try {
                return await result;
              } catch (error) {
                if (error instanceof Error) {
                  throw error;
                }
                throw new _NonError(error);
              }
            })();
          }
          return result;
        } catch (error) {
          if (error instanceof Error) {
            throw error;
          }
          throw new _NonError(error);
        }
      }
      static try(callback) {
        return _NonError.#handleCallback(callback, []);
      }
      static wrap(callback) {
        return (...arguments_) => _NonError.#handleCallback(callback, arguments_);
      }
      // This makes instanceof work even when using the `superclass` option
      static [Symbol.hasInstance](instance) {
        return _NonError.isNonError(instance);
      }
    };
  }
});

// node_modules/serialize-error/error-constructors.js
function addKnownErrorConstructor(constructor, factory) {
  let instance;
  let resolvedName;
  if (factory) {
    if (typeof factory !== "function") {
      throw new TypeError("Factory must be a function");
    }
    try {
      instance = factory();
    } catch (error) {
      throw new Error("Factory is not compatible", { cause: error });
    }
    if (!(instance instanceof constructor)) {
      throw new TypeError("Factory must return an instance of the constructor");
    }
    resolvedName = instance.name;
  } else {
    try {
      instance = new constructor();
    } catch (error) {
      throw new Error(`Constructor "${constructor.name}" is not compatible`, { cause: error });
    }
    resolvedName = instance.name;
  }
  if (!resolvedName || typeof resolvedName !== "string") {
    throw new TypeError('Error instances must have a non-empty string "name" property');
  }
  if (errorConstructors.has(resolvedName)) {
    throw new Error(`Error constructor "${resolvedName}" is already known`);
  }
  errorConstructors.set(resolvedName, constructor);
  if (factory) {
    errorFactories.set(resolvedName, factory);
  }
}
var list, errorConstructors, errorFactories;
var init_error_constructors = __esm({
  "node_modules/serialize-error/error-constructors.js"() {
    list = [
      // Native ES errors https://262.ecma-international.org/12.0/#sec-well-known-intrinsic-objects
      Error,
      EvalError,
      RangeError,
      ReferenceError,
      SyntaxError,
      TypeError,
      URIError,
      AggregateError,
      // Built-in errors
      globalThis.DOMException,
      // Node-specific errors
      // https://nodejs.org/api/errors.html
      globalThis.AssertionError,
      globalThis.SystemError
    ].filter(Boolean).map((constructor) => [constructor.name, constructor]);
    errorConstructors = new Map(list);
    errorFactories = /* @__PURE__ */ new Map();
    __name(addKnownErrorConstructor, "addKnownErrorConstructor");
  }
});

// node_modules/serialize-error/index.js
var serialize_error_exports = {};
__export(serialize_error_exports, {
  NonError: () => NonError,
  addKnownErrorConstructor: () => addKnownErrorConstructor,
  deserializeError: () => deserializeError,
  isErrorLike: () => isErrorLike,
  serializeError: () => serializeError
});
function serializeError(value, options = {}) {
  const {
    maxDepth = Number.POSITIVE_INFINITY,
    useToJSON = true
  } = options;
  if (typeof value === "object" && value !== null) {
    return destroyCircular({
      from: value,
      seen: /* @__PURE__ */ new Set(),
      forceEnumerable: true,
      maxDepth,
      depth: 0,
      useToJSON,
      serialize: true
    });
  }
  if (typeof value === "function") {
    value = "<Function>";
  }
  return destroyCircular({
    from: new NonError(value),
    seen: /* @__PURE__ */ new Set(),
    forceEnumerable: true,
    maxDepth,
    depth: 0,
    useToJSON,
    serialize: true
  });
}
function deserializeError(value, options = {}) {
  const { maxDepth = Number.POSITIVE_INFINITY } = options;
  if (value instanceof Error) {
    return value;
  }
  if (isMinimumViableSerializedError(value)) {
    return destroyCircular({
      from: value,
      seen: /* @__PURE__ */ new Set(),
      to: newError(value.name),
      maxDepth,
      depth: 0,
      serialize: false
    });
  }
  return new NonError(value);
}
function isErrorLike(value) {
  return Boolean(value) && typeof value === "object" && typeof value.name === "string" && typeof value.message === "string" && typeof value.stack === "string";
}
function isMinimumViableSerializedError(value) {
  return Boolean(value) && typeof value === "object" && typeof value.message === "string" && !Array.isArray(value);
}
var errorProperties, toJsonWasCalled, toJSON, newError, destroyCircular;
var init_serialize_error = __esm({
  "node_modules/serialize-error/index.js"() {
    init_non_error();
    init_error_constructors();
    init_error_constructors();
    init_non_error();
    errorProperties = [
      {
        property: "name",
        enumerable: false
      },
      {
        property: "message",
        enumerable: false
      },
      {
        property: "stack",
        enumerable: false
      },
      {
        property: "code",
        enumerable: true
      },
      {
        property: "cause",
        enumerable: false
      },
      {
        property: "errors",
        enumerable: false
      }
    ];
    toJsonWasCalled = /* @__PURE__ */ new WeakSet();
    toJSON = /* @__PURE__ */ __name((from) => {
      toJsonWasCalled.add(from);
      const json = from.toJSON();
      toJsonWasCalled.delete(from);
      return json;
    }, "toJSON");
    newError = /* @__PURE__ */ __name((name) => {
      if (name === "NonError") {
        return new NonError();
      }
      const factory = errorFactories.get(name);
      if (factory) {
        return factory();
      }
      const ErrorConstructor = errorConstructors.get(name) ?? Error;
      return ErrorConstructor === AggregateError ? new ErrorConstructor([]) : new ErrorConstructor();
    }, "newError");
    destroyCircular = /* @__PURE__ */ __name(({
      from,
      seen,
      to,
      forceEnumerable,
      maxDepth,
      depth,
      useToJSON,
      serialize
    }) => {
      if (!to) {
        if (Array.isArray(from)) {
          to = [];
        } else if (!serialize && isErrorLike(from)) {
          to = newError(from.name);
        } else {
          to = {};
        }
      }
      seen.add(from);
      if (depth >= maxDepth) {
        seen.delete(from);
        return to;
      }
      if (useToJSON && typeof from.toJSON === "function" && !toJsonWasCalled.has(from)) {
        seen.delete(from);
        return toJSON(from);
      }
      const continueDestroyCircular = /* @__PURE__ */ __name((value) => destroyCircular({
        from: value,
        seen,
        forceEnumerable,
        maxDepth,
        depth: depth + 1,
        useToJSON,
        serialize
      }), "continueDestroyCircular");
      for (const key of Object.keys(from)) {
        const value = from[key];
        if (value && value instanceof Uint8Array && value.constructor.name === "Buffer") {
          to[key] = serialize ? "[object Buffer]" : value;
          continue;
        }
        if (value !== null && typeof value === "object" && typeof value.pipe === "function") {
          to[key] = serialize ? "[object Stream]" : value;
          continue;
        }
        if (typeof value === "function") {
          if (!serialize) {
            to[key] = value;
          }
          continue;
        }
        if (serialize && typeof value === "bigint") {
          to[key] = `${value}n`;
          continue;
        }
        if (!value || typeof value !== "object") {
          try {
            to[key] = value;
          } catch {
          }
          continue;
        }
        if (!seen.has(value)) {
          to[key] = continueDestroyCircular(value);
          continue;
        }
        to[key] = "[Circular]";
      }
      if (serialize || to instanceof Error) {
        for (const { property, enumerable } of errorProperties) {
          const value = from[property];
          if (value === void 0 || value === null) {
            continue;
          }
          const descriptor = Object.getOwnPropertyDescriptor(to, property);
          if (descriptor?.configurable === false) {
            continue;
          }
          let processedValue = value;
          if (typeof value === "object") {
            processedValue = seen.has(value) ? "[Circular]" : continueDestroyCircular(value);
          }
          Object.defineProperty(to, property, {
            value: processedValue,
            enumerable: forceEnumerable || enumerable,
            configurable: true,
            writable: true
          });
        }
      }
      seen.delete(from);
      return to;
    }, "destroyCircular");
    __name(serializeError, "serializeError");
    __name(deserializeError, "deserializeError");
    __name(isErrorLike, "isErrorLike");
    __name(isMinimumViableSerializedError, "isMinimumViableSerializedError");
  }
});

// build/server/utils/iterables.js
var require_iterables = __commonJS({
  "build/server/utils/iterables.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.isIterable = isIterable;
    exports2.isIterableObject = isIterableObject;
    function isIterable(obj) {
      return obj !== null && obj !== void 0 && typeof obj[Symbol.iterator] === "function";
    }
    __name(isIterable, "isIterable");
    function isIterableObject(obj) {
      return isIterable(obj) && typeof obj === "object";
    }
    __name(isIterableObject, "isIterableObject");
  }
});

// build/server/utils/objects/is-object.js
var require_is_object = __commonJS({
  "build/server/utils/objects/is-object.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.isObject = isObject;
    function isObject(value) {
      return typeof value === "object" && value !== null;
    }
    __name(isObject, "isObject");
  }
});

// build/server/utils/objects/merge-assign.js
var require_merge_assign = __commonJS({
  "build/server/utils/objects/merge-assign.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.mergeAssign = mergeAssign;
    var is_object_js_1 = require_is_object();
    function mergeAssign(target, source1, source2) {
      const targetAsUnion = target;
      for (const object of [source1, source2]) {
        if (!object) {
          continue;
        }
        for (const key of Object.getOwnPropertyNames(object)) {
          if (key === "__proto__" || key === "constructor") {
            continue;
          }
          const value = object[key];
          if ((0, is_object_js_1.isObject)(value)) {
            if (Array.isArray(value)) {
              const existing = targetAsUnion[key];
              targetAsUnion[key] = Array.isArray(existing) ? existing.concat(value) : value;
              continue;
            }
            if (!targetAsUnion[key]) {
              targetAsUnion[key] = {};
            }
            targetAsUnion[key] = mergeAssign(targetAsUnion[key], value);
          } else {
            targetAsUnion[key] = value;
          }
        }
      }
      return targetAsUnion;
    }
    __name(mergeAssign, "mergeAssign");
  }
});

// node_modules/rfdc/index.js
var require_rfdc = __commonJS({
  "node_modules/rfdc/index.js"(exports2, module2) {
    "use strict";
    module2.exports = rfdc;
    function copyBuffer(cur) {
      if (cur instanceof Buffer) {
        return Buffer.from(cur);
      }
      return new cur.constructor(cur.buffer.slice(), cur.byteOffset, cur.length);
    }
    __name(copyBuffer, "copyBuffer");
    function rfdc(opts) {
      opts = opts || {};
      if (opts.circles) return rfdcCircles(opts);
      const constructorHandlers = /* @__PURE__ */ new Map();
      constructorHandlers.set(Date, (o) => new Date(o));
      constructorHandlers.set(Map, (o, fn) => new Map(cloneArray(Array.from(o), fn)));
      constructorHandlers.set(Set, (o, fn) => new Set(cloneArray(Array.from(o), fn)));
      if (opts.constructorHandlers) {
        for (const handler2 of opts.constructorHandlers) {
          constructorHandlers.set(handler2[0], handler2[1]);
        }
      }
      let handler = null;
      return opts.proto ? cloneProto : clone;
      function cloneArray(a, fn) {
        const keys = Object.keys(a);
        const a2 = new Array(keys.length);
        for (let i = 0; i < keys.length; i++) {
          const k = keys[i];
          const cur = a[k];
          if (typeof cur !== "object" || cur === null) {
            a2[k] = cur;
          } else if (cur.constructor !== Object && (handler = constructorHandlers.get(cur.constructor))) {
            a2[k] = handler(cur, fn);
          } else if (ArrayBuffer.isView(cur)) {
            a2[k] = copyBuffer(cur);
          } else {
            a2[k] = fn(cur);
          }
        }
        return a2;
      }
      __name(cloneArray, "cloneArray");
      function clone(o) {
        if (typeof o !== "object" || o === null) return o;
        if (Array.isArray(o)) return cloneArray(o, clone);
        if (o.constructor !== Object && (handler = constructorHandlers.get(o.constructor))) {
          return handler(o, clone);
        }
        const o2 = {};
        for (const k in o) {
          if (Object.hasOwnProperty.call(o, k) === false) continue;
          const cur = o[k];
          if (typeof cur !== "object" || cur === null) {
            o2[k] = cur;
          } else if (cur.constructor !== Object && (handler = constructorHandlers.get(cur.constructor))) {
            o2[k] = handler(cur, clone);
          } else if (ArrayBuffer.isView(cur)) {
            o2[k] = copyBuffer(cur);
          } else {
            o2[k] = clone(cur);
          }
        }
        return o2;
      }
      __name(clone, "clone");
      function cloneProto(o) {
        if (typeof o !== "object" || o === null) return o;
        if (Array.isArray(o)) return cloneArray(o, cloneProto);
        if (o.constructor !== Object && (handler = constructorHandlers.get(o.constructor))) {
          return handler(o, cloneProto);
        }
        const o2 = {};
        for (const k in o) {
          const cur = o[k];
          if (typeof cur !== "object" || cur === null) {
            o2[k] = cur;
          } else if (cur.constructor !== Object && (handler = constructorHandlers.get(cur.constructor))) {
            o2[k] = handler(cur, cloneProto);
          } else if (ArrayBuffer.isView(cur)) {
            o2[k] = copyBuffer(cur);
          } else {
            o2[k] = cloneProto(cur);
          }
        }
        return o2;
      }
      __name(cloneProto, "cloneProto");
    }
    __name(rfdc, "rfdc");
    function rfdcCircles(opts) {
      const refs = [];
      const refsNew = [];
      const constructorHandlers = /* @__PURE__ */ new Map();
      constructorHandlers.set(Date, (o) => new Date(o));
      constructorHandlers.set(Map, (o, fn) => new Map(cloneArray(Array.from(o), fn)));
      constructorHandlers.set(Set, (o, fn) => new Set(cloneArray(Array.from(o), fn)));
      if (opts.constructorHandlers) {
        for (const handler2 of opts.constructorHandlers) {
          constructorHandlers.set(handler2[0], handler2[1]);
        }
      }
      let handler = null;
      return opts.proto ? cloneProto : clone;
      function cloneArray(a, fn) {
        const keys = Object.keys(a);
        const a2 = new Array(keys.length);
        for (let i = 0; i < keys.length; i++) {
          const k = keys[i];
          const cur = a[k];
          if (typeof cur !== "object" || cur === null) {
            a2[k] = cur;
          } else if (cur.constructor !== Object && (handler = constructorHandlers.get(cur.constructor))) {
            a2[k] = handler(cur, fn);
          } else if (ArrayBuffer.isView(cur)) {
            a2[k] = copyBuffer(cur);
          } else {
            const index = refs.indexOf(cur);
            if (index !== -1) {
              a2[k] = refsNew[index];
            } else {
              a2[k] = fn(cur);
            }
          }
        }
        return a2;
      }
      __name(cloneArray, "cloneArray");
      function clone(o) {
        if (typeof o !== "object" || o === null) return o;
        if (Array.isArray(o)) return cloneArray(o, clone);
        if (o.constructor !== Object && (handler = constructorHandlers.get(o.constructor))) {
          return handler(o, clone);
        }
        const o2 = {};
        refs.push(o);
        refsNew.push(o2);
        for (const k in o) {
          if (Object.hasOwnProperty.call(o, k) === false) continue;
          const cur = o[k];
          if (typeof cur !== "object" || cur === null) {
            o2[k] = cur;
          } else if (cur.constructor !== Object && (handler = constructorHandlers.get(cur.constructor))) {
            o2[k] = handler(cur, clone);
          } else if (ArrayBuffer.isView(cur)) {
            o2[k] = copyBuffer(cur);
          } else {
            const i = refs.indexOf(cur);
            if (i !== -1) {
              o2[k] = refsNew[i];
            } else {
              o2[k] = clone(cur);
            }
          }
        }
        refs.pop();
        refsNew.pop();
        return o2;
      }
      __name(clone, "clone");
      function cloneProto(o) {
        if (typeof o !== "object" || o === null) return o;
        if (Array.isArray(o)) return cloneArray(o, cloneProto);
        if (o.constructor !== Object && (handler = constructorHandlers.get(o.constructor))) {
          return handler(o, cloneProto);
        }
        const o2 = {};
        refs.push(o);
        refsNew.push(o2);
        for (const k in o) {
          const cur = o[k];
          if (typeof cur !== "object" || cur === null) {
            o2[k] = cur;
          } else if (cur.constructor !== Object && (handler = constructorHandlers.get(cur.constructor))) {
            o2[k] = handler(cur, cloneProto);
          } else if (ArrayBuffer.isView(cur)) {
            o2[k] = copyBuffer(cur);
          } else {
            const i = refs.indexOf(cur);
            if (i !== -1) {
              o2[k] = refsNew[i];
            } else {
              o2[k] = cloneProto(cur);
            }
          }
        }
        refs.pop();
        refsNew.pop();
        return o2;
      }
      __name(cloneProto, "cloneProto");
    }
    __name(rfdcCircles, "rfdcCircles");
  }
});

// build/server/utils/objects/merge-options-with-defaults.js
var require_merge_options_with_defaults = __commonJS({
  "build/server/utils/objects/merge-options-with-defaults.js"(exports2) {
    "use strict";
    var __importDefault2 = exports2 && exports2.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.mergeOptionsWithDefaults = mergeOptionsWithDefaults;
    var rfdc_1 = __importDefault2(require_rfdc());
    var is_object_js_1 = require_is_object();
    var deepClone = (0, rfdc_1.default)();
    function mergeOptionsWithDefaultsInner(options, defaults, seen, mapped, circulars) {
      if (!(0, is_object_js_1.isObject)(options)) {
        return deepClone(defaults);
      }
      const result = {};
      for (const key of Object.keys(defaults)) {
        const fromDefaults = defaults[key];
        const fromOptions = options[key];
        if (fromOptions !== void 0) {
          if ((0, is_object_js_1.isObject)(fromOptions)) {
            if (seen.has(fromOptions)) {
              circulars.add([fromOptions, result, key]);
              continue;
            }
            seen.add(fromOptions);
            const value = Array.isArray(fromOptions) ? fromOptions.map((item) => deepClone(item)) : (0, is_object_js_1.isObject)(fromDefaults) && !Array.isArray(fromDefaults) ? mergeOptionsWithDefaultsInner(fromOptions, fromDefaults, seen, mapped, circulars) : deepClone(fromOptions);
            mapped.set(fromOptions, value);
            result[key] = value;
            continue;
          }
          result[key] = fromOptions;
          continue;
        }
        result[key] = deepClone(fromDefaults);
      }
      return result;
    }
    __name(mergeOptionsWithDefaultsInner, "mergeOptionsWithDefaultsInner");
    function mergeOptionsWithDefaults(options, defaults) {
      const seen = /* @__PURE__ */ new WeakSet();
      const mapped = /* @__PURE__ */ new WeakMap();
      const circulars = /* @__PURE__ */ new Set();
      const result = mergeOptionsWithDefaultsInner(options, defaults, seen, mapped, circulars);
      for (const [circular, obj, key] of circulars) {
        obj[key] = mapped.get(circular);
      }
      return result;
    }
    __name(mergeOptionsWithDefaults, "mergeOptionsWithDefaults");
  }
});

// build/server/utils/objects/index.js
var require_objects = __commonJS({
  "build/server/utils/objects/index.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: /* @__PURE__ */ __name(function() {
          return m[k];
        }, "get") };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports2 && exports2.__exportStar || function(m, exports3) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p)) __createBinding(exports3, m, p);
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    __exportStar(require_is_object(), exports2);
    __exportStar(require_merge_assign(), exports2);
    __exportStar(require_merge_options_with_defaults(), exports2);
  }
});

// build/server/utils/errors.js
var require_errors4 = __commonJS({
  "build/server/utils/errors.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.serializeErrors = serializeErrors;
    var serialize_error_1 = (init_serialize_error(), __toCommonJS(serialize_error_exports));
    var iterables_js_1 = require_iterables();
    var index_js_1 = require_objects();
    function serializeErrors(object) {
      const serializeInner = /* @__PURE__ */ __name((obj, visited) => {
        if (!obj || typeof obj !== "object") {
          return obj;
        }
        if (visited.has(obj)) {
          return visited.get(obj);
        }
        if (obj instanceof Error) {
          const result = (0, serialize_error_1.serializeError)(obj);
          visited.set(obj, result);
          return result;
        }
        if (obj instanceof Map) {
          const result = /* @__PURE__ */ new Map();
          visited.set(obj, result);
          for (const [key, value] of obj) {
            const serializedKey = serializeInner(key, visited);
            const serializedValue = serializeInner(value, visited);
            if ((0, index_js_1.isObject)(key)) {
              visited.set(key, serializedKey);
            }
            if ((0, index_js_1.isObject)(value)) {
              visited.set(value, serializedValue);
            }
            result.set(serializedKey, serializedValue);
          }
          return result;
        }
        if (obj instanceof Set) {
          const result = /* @__PURE__ */ new Set();
          visited.set(obj, result);
          for (const value of obj) {
            if (!(0, index_js_1.isObject)(value)) {
              result.add(value);
              continue;
            }
            const serializedValue = serializeInner(value, visited);
            visited.set(value, serializedValue);
            result.add(serializedValue);
          }
          return result;
        }
        if ((0, iterables_js_1.isIterable)(obj)) {
          const result = [];
          visited.set(obj, result);
          for (const value of obj) {
            result.push(serializeInner(value, visited));
          }
          return result;
        }
        visited.set(obj, "[Circular]");
        const serializedObj = Object.fromEntries(Object.entries(obj).map(([key, value]) => {
          if (!(0, index_js_1.isObject)(value)) {
            return [key, value];
          }
          if (visited.has(value)) {
            return [key, visited.get(value)];
          }
          if (value instanceof Error) {
            const serialized = (0, serialize_error_1.serializeError)(value);
            visited.set(value, serialized);
            return [key, serialized];
          }
          const result = serializeInner(value, visited);
          visited.set(value, result);
          return [key, result];
        }));
        visited.set(obj, serializedObj);
        return serializedObj;
      }, "serializeInner");
      return serializeInner(object, /* @__PURE__ */ new WeakMap());
    }
    __name(serializeErrors, "serializeErrors");
  }
});

// build/server/utils/logging/error-formatter.js
var require_error_formatter = __commonJS({
  "build/server/utils/logging/error-formatter.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ErrorFormatter = void 0;
    var errors_js_1 = require_errors4();
    var ErrorFormatter = class {
      static {
        __name(this, "ErrorFormatter");
      }
      transform(info) {
        const transformed = (0, errors_js_1.serializeErrors)({ ...info });
        for (const key of Object.keys(transformed)) {
          info[key] = transformed[key];
        }
        return info;
      }
    };
    exports2.ErrorFormatter = ErrorFormatter;
  }
});

// build/server/utils/logging/get-log-function.js
var require_get_log_function = __commonJS({
  "build/server/utils/logging/get-log-function.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getLogFunction = void 0;
    var getLogFunction = /* @__PURE__ */ __name((remoteConsole, level) => {
      const logFunction = remoteConsole[level];
      if (typeof logFunction === "function") {
        return logFunction;
      }
      return void 0;
    }, "getLogFunction");
    exports2.getLogFunction = getLogFunction;
  }
});

// build/server/utils/strings.js
var require_strings = __commonJS({
  "build/server/utils/strings.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.padNumber = exports2.padString = exports2.upperCaseFirstChar = void 0;
    var upperCaseFirstChar = /* @__PURE__ */ __name((str) => {
      return str.charAt(0).toUpperCase() + str.slice(1);
    }, "upperCaseFirstChar");
    exports2.upperCaseFirstChar = upperCaseFirstChar;
    var padString = /* @__PURE__ */ __name((str, length) => {
      return str + " ".repeat(length - str.length);
    }, "padString");
    exports2.padString = padString;
    var padNumber = /* @__PURE__ */ __name((number, length) => {
      const str = String(number);
      return "0".repeat(length - str.length) + str;
    }, "padNumber");
    exports2.padNumber = padNumber;
  }
});

// build/server/utils/logging/language-server-formatter.js
var require_language_server_formatter = __commonJS({
  "build/server/utils/logging/language-server-formatter.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.LanguageServerFormatter = void 0;
    var triple_beam_1 = require_triple_beam();
    var get_log_function_js_1 = require_get_log_function();
    var strings_js_1 = require_strings();
    var LanguageServerFormatter = class {
      static {
        __name(this, "LanguageServerFormatter");
      }
      options;
      constructor(options) {
        this.options = options;
      }
      transform(info) {
        const date = /* @__PURE__ */ new Date();
        const timestamp = `${date.getHours() % 12 || 12}:${(0, strings_js_1.padNumber)(date.getMinutes(), 2)}:${(0, strings_js_1.padNumber)(date.getSeconds(), 2)} ${date.getHours() < 12 ? "a.m." : "p.m."}`;
        const messageParts = [];
        const level = String(info[triple_beam_1.LEVEL]);
        if (!(0, get_log_function_js_1.getLogFunction)(this.options.connection.console, level)) {
          messageParts.push(`[${(0, strings_js_1.padString)((0, strings_js_1.upperCaseFirstChar)(level), 5)} - ${timestamp}]`);
        }
        if (info.component) {
          messageParts.push(`[${String(info.component)}]`);
        }
        messageParts.push(info.message);
        delete info.component;
        delete info.timestamp;
        const keys = new Set(Object.keys({ ...info }));
        const postMessageParts = [];
        if (this.options.preferredKeyOrder) {
          for (const key of this.options.preferredKeyOrder) {
            if (keys.has(key)) {
              postMessageParts.push(`${key}: ${JSON.stringify(info[key])}`);
              keys.delete(key);
              delete info[key];
            }
          }
        }
        for (const key of keys) {
          if (key === "level" || key === "message") {
            continue;
          }
          postMessageParts.push(`${key}: ${JSON.stringify(info[key])}`);
          delete info[key];
        }
        const message = postMessageParts.length > 0 ? `${messageParts.join(" ")} | ${postMessageParts.join(" ")}` : messageParts.join(" ");
        info[triple_beam_1.MESSAGE] = message;
        info.message = message;
        return info;
      }
    };
    exports2.LanguageServerFormatter = LanguageServerFormatter;
  }
});

// build/server/utils/logging/language-server-transport.js
var require_language_server_transport = __commonJS({
  "build/server/utils/logging/language-server-transport.js"(exports2) {
    "use strict";
    var __importDefault2 = exports2 && exports2.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.LanguageServerTransport = void 0;
    var winston_transport_1 = __importDefault2(require_winston_transport());
    var triple_beam_1 = require_triple_beam();
    var get_log_function_js_1 = require_get_log_function();
    var LanguageServerTransport = class extends winston_transport_1.default {
      static {
        __name(this, "LanguageServerTransport");
      }
      /**
       * The language server remote console.
       */
      #console;
      constructor(options) {
        super(options);
        this.#console = options.connection.console;
      }
      log(info, callback) {
        setImmediate(() => {
          this.emit("logged", info);
        });
        try {
          const logFunc = (0, get_log_function_js_1.getLogFunction)(this.#console, String(info[triple_beam_1.LEVEL]));
          if (typeof logFunc === "function") {
            logFunc.call(this.#console, String(info[triple_beam_1.MESSAGE]));
          } else {
            this.#console.log(String(info[triple_beam_1.MESSAGE]));
          }
        } catch (error) {
          if (!(error instanceof Error) || !error.message.includes("Connection is disposed")) {
            this.emit("error", error);
          }
        }
        callback();
      }
    };
    exports2.LanguageServerTransport = LanguageServerTransport;
  }
});

// build/server/utils/logging/index.js
var require_logging = __commonJS({
  "build/server/utils/logging/index.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: /* @__PURE__ */ __name(function() {
          return m[k];
        }, "get") };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports2 && exports2.__exportStar || function(m, exports3) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p)) __createBinding(exports3, m, p);
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    __exportStar(require_error_formatter(), exports2);
    __exportStar(require_get_log_function(), exports2);
    __exportStar(require_language_server_formatter(), exports2);
    __exportStar(require_language_server_transport(), exports2);
  }
});

// build/server/utils/lsp/create-disable-completion-item.js
var require_create_disable_completion_item = __commonJS({
  "build/server/utils/lsp/create-disable-completion-item.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.createDisableCompletionItem = createDisableCompletionItem;
    var vscode_languageserver_types_1 = require_main();
    function createDisableCompletionItem(disableType, rule = "") {
      const item = vscode_languageserver_types_1.CompletionItem.create(disableType);
      item.kind = vscode_languageserver_types_1.CompletionItemKind.Snippet;
      item.insertTextFormat = vscode_languageserver_types_1.InsertTextFormat.Snippet;
      if (disableType === "stylelint-disable") {
        item.insertText = `/* stylelint-disable \${0:${rule || "rule"}} */
/* stylelint-enable \${0:${rule || "rule"}} */`;
        item.detail = "Turn off all Stylelint or individual rules, after which you do not need to re-enable Stylelint. (Stylelint)";
        item.documentation = {
          kind: vscode_languageserver_types_1.MarkupKind.Markdown,
          value: `\`\`\`css
/* stylelint-disable ${rule || "rule"} */
/* stylelint-enable ${rule || "rule"} */
\`\`\``
        };
      } else {
        item.insertText = `/* ${disableType} \${0:${rule || "rule"}} */`;
        item.detail = disableType === "stylelint-disable-line" ? "Turn off Stylelint rules for individual lines only, after which you do not need to explicitly re-enable them. (Stylelint)" : "Turn off Stylelint rules for the next line only, after which you do not need to explicitly re-enable them. (Stylelint)";
        item.documentation = {
          kind: vscode_languageserver_types_1.MarkupKind.Markdown,
          value: `\`\`\`css
/* ${disableType} ${rule || "rule"} */
\`\`\``
        };
      }
      return item;
    }
    __name(createDisableCompletionItem, "createDisableCompletionItem");
  }
});

// build/server/utils/lsp/display-error.js
var require_display_error = __commonJS({
  "build/server/utils/lsp/display-error.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.displayError = displayError;
    var iterables_js_1 = require_iterables();
    function displayError(connection, err) {
      if (!(err instanceof Error)) {
        connection.window.showErrorMessage(String(err).replace(/\n/gu, " "));
        return;
      }
      if ((0, iterables_js_1.isIterableObject)(err?.reasons)) {
        for (const reason of err.reasons) {
          connection.window.showErrorMessage(`Stylelint: ${reason}`);
        }
        return;
      }
      if (err?.code === 78) {
        connection.window.showErrorMessage(`Stylelint: ${err.message}`);
        return;
      }
      connection.window.showErrorMessage((err.stack || err.message).replace(/\n/gu, " "));
    }
    __name(displayError, "displayError");
  }
});

// build/server/utils/lsp/rule-code-actions-collection.js
var require_rule_code_actions_collection = __commonJS({
  "build/server/utils/lsp/rule-code-actions-collection.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.RuleCodeActionsCollection = void 0;
    var RuleCodeActionsCollection = class {
      static {
        __name(this, "RuleCodeActionsCollection");
      }
      /**
       * The code actions, keyed by their rule.
       */
      #actions = /* @__PURE__ */ new Map();
      /**
       * Gets the code actions for a rule.
       */
      get(ruleId) {
        const existing = this.#actions.get(ruleId);
        if (existing) {
          return existing;
        }
        const actions = {};
        this.#actions.set(ruleId, actions);
        return actions;
      }
      /**
       * Iterates over the code actions, grouped by rule and sorted by the
       * priority of the rule.
       */
      *[Symbol.iterator]() {
        for (const actions of this.#actions.values()) {
          if (actions.disableLine) {
            yield actions.disableLine;
          }
          if (actions.disableFile) {
            yield actions.disableFile;
          }
          if (actions.documentation) {
            yield actions.documentation;
          }
        }
      }
      /**
       * Gets the number of code actions.
       */
      get size() {
        const iterator = this[Symbol.iterator]();
        let size = 0;
        while (!iterator.next().done) {
          size++;
        }
        return size;
      }
    };
    exports2.RuleCodeActionsCollection = RuleCodeActionsCollection;
  }
});

// build/server/utils/lsp/types.js
var require_types4 = __commonJS({
  "build/server/utils/lsp/types.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
  }
});

// build/server/utils/lsp/index.js
var require_lsp = __commonJS({
  "build/server/utils/lsp/index.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: /* @__PURE__ */ __name(function() {
          return m[k];
        }, "get") };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports2 && exports2.__exportStar || function(m, exports3) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p)) __createBinding(exports3, m, p);
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    __exportStar(require_create_disable_completion_item(), exports2);
    __exportStar(require_display_error(), exports2);
    __exportStar(require_rule_code_actions_collection(), exports2);
    __exportStar(require_types4(), exports2);
  }
});

// build/server/utils/fs.js
var require_fs = __commonJS({
  "build/server/utils/fs.js"(exports2) {
    "use strict";
    var __importDefault2 = exports2 && exports2.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.normalizeFsPath = normalizeFsPath;
    var node_process_12 = __importDefault2(require("node:process"));
    function normalizeFsPath(value, platform = node_process_12.default.platform) {
      if (!value) {
        return void 0;
      }
      return platform === "win32" ? value.replace(/\//gu, "\\") : value;
    }
    __name(normalizeFsPath, "normalizeFsPath");
  }
});

// build/server/utils/sets.js
var require_sets = __commonJS({
  "build/server/utils/sets.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.intersect = intersect;
    function intersect(set1, set2) {
      if (!set1) {
        return set2;
      }
      if (!set2) {
        return set1;
      }
      const [smallerSet, largerSet] = set1.size < set2.size ? [set1, set2] : [set2, set1];
      const result = /* @__PURE__ */ new Set();
      for (const item of smallerSet) {
        if (largerSet.has(item)) {
          result.add(item);
        }
      }
      return result;
    }
    __name(intersect, "intersect");
  }
});

// build/server/utils/types.js
var require_types5 = __commonJS({
  "build/server/utils/types.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
  }
});

// build/server/utils/index.js
var require_utils = __commonJS({
  "build/server/utils/index.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: /* @__PURE__ */ __name(function() {
          return m[k];
        }, "get") };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports2 && exports2.__exportStar || function(m, exports3) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p)) __createBinding(exports3, m, p);
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    __exportStar(require_documents(), exports2);
    __exportStar(require_functions(), exports2);
    __exportStar(require_logging(), exports2);
    __exportStar(require_lsp(), exports2);
    __exportStar(require_objects(), exports2);
    __exportStar(require_errors4(), exports2);
    __exportStar(require_fs(), exports2);
    __exportStar(require_iterables(), exports2);
    __exportStar(require_sets(), exports2);
    __exportStar(require_strings(), exports2);
    __exportStar(require_types5(), exports2);
  }
});

// build/server/worker/worker-logging.service.js
var require_worker_logging_service = __commonJS({
  "build/server/worker/worker-logging.service.js"(exports2) {
    "use strict";
    var __importDefault2 = exports2 && exports2.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.createWorkerLoggingService = createWorkerLoggingService;
    var node_process_12 = __importDefault2(require("node:process"));
    var winston_1 = __importDefault2(require_winston());
    var index_js_1 = require_utils();
    var workerLevels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
    function parseLogLevel(value) {
      if (!value) {
        return void 0;
      }
      if (value === "error" || value === "warn" || value === "info" || value === "debug") {
        return value;
      }
      return void 0;
    }
    __name(parseLogLevel, "parseLogLevel");
    var defaultLevel = parseLogLevel(node_process_12.default.env.STYLELINT_WORKER_LOG_LEVEL) ?? "warn";
    var defaultLogPath = node_process_12.default.env.STYLELINT_WORKER_LOG_PATH;
    var createFormats = /* @__PURE__ */ __name(() => winston_1.default.format.combine(new index_js_1.ErrorFormatter(), winston_1.default.format.timestamp(), winston_1.default.format.json()), "createFormats");
    function createWorkerLoggingService(options = {}) {
      const level = options.level ?? defaultLevel;
      const transports = [
        new winston_1.default.transports.Console({
          format: createFormats()
        })
      ];
      const logPath = options.logPath ?? defaultLogPath;
      if (logPath) {
        transports.push(new winston_1.default.transports.File({
          filename: logPath,
          format: createFormats()
        }));
      }
      const workspaceRoot = options.workspaceRoot ?? node_process_12.default.env.STYLELINT_WORKSPACE ?? node_process_12.default.cwd();
      const logger = winston_1.default.createLogger({
        level,
        levels: workerLevels,
        defaultMeta: {
          pid: node_process_12.default.pid,
          process: "stylelint-worker",
          workspaceRoot
        },
        transports
      });
      return {
        createLogger: /* @__PURE__ */ __name((component) => {
          const serviceName = component.name || "UnknownService";
          return logger.child({ service: serviceName });
        }, "createLogger")
      };
    }
    __name(createWorkerLoggingService, "createWorkerLoggingService");
  }
});

// build/server/worker/worker-entry.js
var __importDefault = exports && exports.__importDefault || function(mod) {
  return mod && mod.__esModule ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var promises_1 = __importDefault(require("node:fs/promises"));
var node_module_1 = require("node:module");
var node_os_1 = __importDefault(require("node:os"));
var node_path_1 = __importDefault(require("node:path"));
var node_process_1 = __importDefault(require("node:process"));
var global_path_resolver_service_js_1 = require_global_path_resolver_service();
var package_root_service_js_1 = require_package_root_service();
var process_runner_service_js_1 = require_process_runner_service();
var load_stylelint_js_1 = require_load_stylelint();
var types_js_1 = require_types3();
var worker_logging_service_js_1 = require_worker_logging_service();
var toAbsoluteDir = /* @__PURE__ */ __name((dir) => node_path_1.default.isAbsolute(dir) ? dir : node_path_1.default.resolve(node_process_1.default.cwd(), dir), "toAbsoluteDir");
var workspaceRequire = (0, node_module_1.createRequire)(node_path_1.default.join(node_process_1.default.cwd(), "__stylelint_worker_index__.js"));
var workerLoggingService = (0, worker_logging_service_js_1.createWorkerLoggingService)();
var globalPathResolver = new global_path_resolver_service_js_1.GlobalPathResolverService(node_os_1.default, node_path_1.default, new process_runner_service_js_1.ProcessRunnerService(), workerLoggingService);
var packageRootFinder = new package_root_service_js_1.PackageRootService();
var state = {};
var createLinterResultSubset = /* @__PURE__ */ __name((linterResult) => {
  const subset = {
    results: (Array.isArray(linterResult.results) ? linterResult.results : []).map(({ warnings, invalidOptionWarnings, ignored }) => ({
      warnings: warnings ?? [],
      invalidOptionWarnings: invalidOptionWarnings ?? [],
      ignored
    }))
  };
  const report = linterResult.report;
  if (typeof report === "string") {
    subset.report = report;
  }
  const code = linterResult.code;
  if (typeof code === "string") {
    subset.code = code;
  }
  if (!report && !code) {
    const output = linterResult.output;
    if (typeof output === "string") {
      subset.output = output;
    }
  }
  if (linterResult.ruleMetadata) {
    subset.ruleMetadata = linterResult.ruleMetadata;
  }
  return subset;
}, "createLinterResultSubset");
var isPromiseLike = /* @__PURE__ */ __name((value) => typeof value === "object" && value !== null && "then" in value, "isPromiseLike");
var sendMessage = /* @__PURE__ */ __name((message) => {
  if (typeof node_process_1.default.send === "function") {
    node_process_1.default.send(message);
  }
}, "sendMessage");
var serializeError2 = /* @__PURE__ */ __name((error) => {
  if (error instanceof Error) {
    const rawCode = error.code;
    const serialized = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: typeof rawCode === "number" ? String(rawCode) : rawCode
    };
    return serialized;
  }
  return {
    name: "Error",
    message: typeof error === "string" ? error : "Unknown error"
  };
}, "serializeError");
var createNotFoundError = /* @__PURE__ */ __name(() => {
  const error = new Error("Stylelint could not be resolved from the current workspace.");
  error.code = types_js_1.stylelintNotFoundError;
  return error;
}, "createNotFoundError");
async function snapshotRuleMetadata(stylelintModule) {
  const rulesSource = stylelintModule.rules;
  if (!rulesSource) {
    return void 0;
  }
  let resolvedRules;
  if (typeof rulesSource === "function") {
    resolvedRules = await rulesSource();
  } else if (isPromiseLike(rulesSource)) {
    resolvedRules = await rulesSource;
  } else {
    resolvedRules = rulesSource;
  }
  if (!resolvedRules || typeof resolvedRules !== "object") {
    return void 0;
  }
  const metadata = {};
  for (const [name, ruleOrPromise] of Object.entries(resolvedRules)) {
    const rulePromise = isPromiseLike(ruleOrPromise) ? ruleOrPromise : Promise.resolve(ruleOrPromise);
    const rule = await rulePromise;
    const meta = rule?.meta;
    if (meta) {
      metadata[name] = meta;
    }
  }
  return Object.keys(metadata).length ? metadata : void 0;
}
__name(snapshotRuleMetadata, "snapshotRuleMetadata");
async function readPackageVersion(packageRoot) {
  if (!packageRoot) {
    return void 0;
  }
  try {
    const manifestPath = node_path_1.default.join(packageRoot, "package.json");
    const rawManifest = await promises_1.default.readFile(manifestPath, "utf8");
    const manifest = JSON.parse(rawManifest);
    return manifest.version;
  } catch {
    return void 0;
  }
}
__name(readPackageVersion, "readPackageVersion");
async function resolveFromGlobal(packageManager, resolver) {
  if (!packageManager) {
    return void 0;
  }
  const globalModulesPath = await globalPathResolver.resolve(packageManager);
  if (!globalModulesPath) {
    return void 0;
  }
  return await resolver(globalModulesPath);
}
__name(resolveFromGlobal, "resolveFromGlobal");
async function resolveStylelintTarget(stylelintPath, codeFilename, runnerOptions) {
  if (stylelintPath) {
    const normalizedPath = node_path_1.default.isAbsolute(stylelintPath) ? stylelintPath : node_path_1.default.resolve(node_process_1.default.cwd(), stylelintPath);
    const resolvedPath = await packageRootFinder.find(normalizedPath) ?? normalizedPath;
    return {
      specifier: normalizedPath,
      entryPath: normalizedPath,
      requireFn: workspaceRequire,
      resolvedPath
    };
  }
  const candidateDirs = /* @__PURE__ */ new Set();
  if (codeFilename) {
    candidateDirs.add(node_path_1.default.dirname(codeFilename));
  }
  candidateDirs.add(node_process_1.default.cwd());
  const tryResolveFromDir = /* @__PURE__ */ __name(async (dir) => {
    const baseDir = toAbsoluteDir(dir);
    const requireFn = (0, node_module_1.createRequire)(node_path_1.default.join(baseDir, "__stylelint_worker_index__.js"));
    try {
      const entryPath = requireFn.resolve("stylelint");
      const resolvedPath = await packageRootFinder.find(entryPath) ?? entryPath;
      return {
        specifier: "stylelint",
        entryPath,
        requireFn,
        resolvedPath
      };
    } catch (error) {
      if (error.code !== "MODULE_NOT_FOUND") {
        throw error;
      }
      return void 0;
    }
  }, "tryResolveFromDir");
  for (const dir of candidateDirs) {
    const resolved = await tryResolveFromDir(dir);
    if (resolved) {
      return resolved;
    }
  }
  const globalResolved = await resolveFromGlobal(runnerOptions?.packageManager, tryResolveFromDir);
  if (globalResolved) {
    return globalResolved;
  }
  throw createNotFoundError();
}
__name(resolveStylelintTarget, "resolveStylelintTarget");
async function ensureStylelint(stylelintPath, codeFilename, runnerOptions) {
  const target = await resolveStylelintTarget(stylelintPath, codeFilename, runnerOptions);
  if (state.stylelint && state.resolvedPath === target.resolvedPath) {
    return;
  }
  try {
    const { stylelint: loaded } = await (0, load_stylelint_js_1.loadStylelint)(packageRootFinder, target.specifier, target.requireFn, target.entryPath);
    state.stylelint = loaded;
    state.entryPath = target.entryPath;
    state.resolvedPath = target.resolvedPath;
    state.ruleMetadata = await snapshotRuleMetadata(loaded);
    state.version = await readPackageVersion(target.resolvedPath);
  } catch (error) {
    const code = error.code;
    const isModuleNotFound = code === "MODULE_NOT_FOUND" || code === types_js_1.stylelintNotFoundError;
    if (isModuleNotFound) {
      throw createNotFoundError();
    }
    throw error;
  }
}
__name(ensureStylelint, "ensureStylelint");
async function handleResolve(request) {
  await ensureStylelint(request.payload.stylelintPath, request.payload.codeFilename, request.payload.runnerOptions);
  if (!state.resolvedPath || !state.entryPath) {
    throw createNotFoundError();
  }
  sendMessage({
    id: request.id,
    success: true,
    result: {
      resolvedPath: state.resolvedPath,
      entryPath: state.entryPath,
      version: state.version
    }
  });
}
__name(handleResolve, "handleResolve");
async function handleLint(request) {
  await ensureStylelint(request.payload.stylelintPath, request.payload.options.codeFilename, request.payload.runnerOptions);
  if (!state.stylelint || !state.resolvedPath) {
    throw createNotFoundError();
  }
  const linterResult = await state.stylelint.lint(request.payload.options);
  const subsetResult = createLinterResultSubset(linterResult);
  sendMessage({
    id: request.id,
    success: true,
    result: {
      resolvedPath: state.resolvedPath,
      linterResult: subsetResult,
      ruleMetadata: state.ruleMetadata
    }
  });
}
__name(handleLint, "handleLint");
async function handleResolveConfig(request) {
  await ensureStylelint(request.payload.stylelintPath, request.payload.filePath, request.payload.runnerOptions);
  if (!state.stylelint || !state.resolvedPath) {
    throw createNotFoundError();
  }
  const resolveConfigFn = state.stylelint.resolveConfig;
  let config;
  if (typeof resolveConfigFn === "function") {
    config = await resolveConfigFn(request.payload.filePath);
  }
  sendMessage({
    id: request.id,
    success: true,
    result: {
      resolvedPath: state.resolvedPath,
      config
    }
  });
}
__name(handleResolveConfig, "handleResolveConfig");
var handleMessage = /* @__PURE__ */ __name(async (request) => {
  if (!request) {
    return;
  }
  try {
    switch (request.type) {
      case "resolve": {
        await handleResolve(request);
        break;
      }
      case "resolveConfig": {
        await handleResolveConfig(request);
        break;
      }
      case "lint": {
        await handleLint(request);
        break;
      }
      case "shutdown": {
        sendMessage({ id: request.id, success: true });
        node_process_1.default.exitCode = 0;
        return;
      }
      default:
        throw new Error(`Unknown worker request type: ${request.type}`);
    }
  } catch (error) {
    sendMessage({
      id: request.id,
      success: false,
      error: serializeError2(error)
    });
  }
}, "handleMessage");
node_process_1.default.on("message", (request) => {
  void handleMessage(request);
});
node_process_1.default.on("disconnect", () => {
  node_process_1.default.exitCode = 0;
});
//# sourceMappingURL=worker-entry.js.map
