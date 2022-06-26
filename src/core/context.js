//++ core/context ++//

  /**
   * Context object.
   * 
   * @namespace Lum.context
   * 
   * Offers some insight into the current JS context.
   * 
   */
   const ctx = prop(Lum, 'context', init).context;

   prop(ctx, 'isWindow', !init.node && root.window !== undefined);
   prop(ctx, 'isWorker', !init.node && root.WorkerGlobalScope !== undefined);
   prop(ctx, 'isServiceWorker', !init.node && root.ServiceWorkerGlobalScope !== undefined);
   prop(ctx, 'isBrowser', ctx.isWindow || ctx.isWorker);
 
   // Does the global object/property exist?
   function hasRoot(ns)
   {
     if (typeof hasRoot[ns] === B) return hasRoot[ns];
     const result = (getNamespace(ns) !== undefined);
     prop(hasRoot, ns, result);
     return result;
   }
 
   // Build some common has items.
   for (const what of ['Proxy','Promise','Reflect','fetch'])
   {
     hasRoot(what);
   }
 
   prop(ctx, 'has', hasRoot);
 
   console.debug("Lum.context", ctx);

//-- core/context --//