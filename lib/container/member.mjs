import utils from "utils";

const contextLock = new Map();
const eventStack = new WeakMap();
const membersInfo = new Map();
const memberInstances = new Map();
const eventSubscriptions = new Map();
const eventQueue = new Map();

setInterval(async () => {
   const contextIds = contextLock.keys();
   for (const contextId of contextIds) {
      if (!contextLock.get(contextId)) {
         contextLock.set(contextId, true);
         const id = setInterval(async () => {
            if (eventQueue.has(contextId)) {
               const contextEventQueue = eventQueue.get(contextId);
               for (let i = 0; i < contextEventQueue.length; i++) {
                  const event = contextEventQueue[i];
                  if (event.isRaised) {
                     contextEventQueue.splice(i, 1);
                  }
               }
               const eventsReadyForContext = contextEventQueue.filter(e => e.ready && !e.isRaised && !e.isRaising);
               for (const event of eventsReadyForContext) {
                  try {
                     await event.raise();
                  } catch (error) {
                     console.error(error);
                  }
               }
               const eventsRaisingForContext = contextEventQueue.filter(e => e.isRaising);
               if (eventsRaisingForContext.length === 0) {
                  contextLock.set(contextId, false);
                  clearInterval(id);
               }
            }
         }, 100);
      }
   }
}, 100)

class MemberEvent {
   constructor({ memberInfo, data, promise, context }) {
      this.Id = `${MemberEvent.name}(${memberInfo.name}(${memberInfo.Id}))`;
      this.data = data;
      this.memberId = memberInfo.Id;
      this.promise = promise;
      this.contextId = context.contextId;
      if (!eventQueue.has(this.contextId)) {
         eventQueue.set(this.contextId, []);
      }
      if (!eventSubscriptions.has(memberInfo.Id)) {
         eventSubscriptions.set(memberInfo.Id, []);
      }
      if (!eventStack.has(context)) {
         eventStack.set(context, []);
      }
      if (memberInfo.isPublic) {
         const events = eventStack.get(context);
         events.unshift(this);
      }
      const queue = eventQueue.get(this.contextId);
      queue.push(this);
      this.ready = true;
      this.isRaised = false;
      this.isRaising = false;
   }
   async raise() {
      this.isRaising = true;
      const sortedSubscriptions = eventSubscriptions.get(this.memberId).sort((s1, s2) => s1.priority - s2.priority);
      for (const { memberInfo, context, promise } of sortedSubscriptions) {
         try {
            const output = await promise.call(context, { memberInfo, data: this.data });
            this.promise.resolve(output);
         } catch (error) {
            this.isRaised = true;
            this.promise.reject(error);
         }
      }
      this.isRaised = true;
   }
}

class MemberEventSubscription {
   constructor({ memberInfo, context, data = {}, promise, priority }) {
      this.Id = utils.generateGUID();
      if (!eventSubscriptions.has(memberInfo.Id)) {
         eventSubscriptions.set(memberInfo.Id, []);
      }
      eventSubscriptions.get(memberInfo.Id).push({ memberInfo, context, data, promise, priority });
   }
}

export class Member {
   constructor({ memberInfo, context, isProxy = false }) {
      this.Id = utils.generateGUID();
      if (!contextLock.has(context.contextId)) {
         contextLock.set(context.contextId, false);
      }
      if (!isProxy) {
         if (memberInstances.has(memberInfo.Id)) {
            memberInstances.set(memberInfo.Id, []);
         }
         addToMembersInfo({ context, memberInfo });
         if (memberInfo.isClass || memberInfo.isContainerClass || memberInfo.isValueType) {
            new MemberEventSubscription({ memberInfo, context, promise: propertyMemberCallback, priority: 2 });
         } else if (memberInfo.isPublic) {
            new MemberEventSubscription({ memberInfo, context, promise: publicMemberEventCallback, priority: 1 });
         } else if (memberInfo.isAsync) {
            new MemberEventSubscription({ memberInfo, context, promise: privateMemberEventCallback, priority: 3 });
         }
      }
      createMember({ context, memberInfo });
   }
}

const propertyMemberCallback = function ({ memberInfo, data }) {
   return new Promise((resolve, reject) => {
      isPublicMemberEventRaised({ context: this, memberInfo });
      if (memberInfo.isValueType) {
         if (data !== undefined && data !== null) {
            memberInfo.value = data;
         }
         return resolve(memberInfo.value);
      }
      if (memberInfo.isClass || memberInfo.isContainerClass) {
         let instance = getInstance({ memberInfo });
         if (instance) {
            return resolve(instance);
         }
         if (!Array.isArray(memberInfo.func)) {
            memberInfo.func = [memberInfo.func];
         }
         const instances = [];
         for (const Class of memberInfo.func) {
            if (typeof Class === 'function') {
               try {
                  const instance = new Class(memberInfo.args);
                  instances.push(instance);
                  console.log(`${this.contextId} created a new instance of ${instance.contextId}`);
               } catch (error) {
                  if (memberInfo.errorHalt) {
                     reject(error);
                  } else {
                     console.error(error);
                     return resolve(memberInfo.errorReturn);
                  }
               }
            } else {
               reject(new Error('member is not a class'));
            }
         }
         setInstances({ memberInfo, instances });
         instance = getInstance({ memberInfo });
         return resolve(instance);
      }
   });
}

const publicMemberEventCallback = function ({ memberInfo, data }) {
   return new Promise(async (resolve, reject) => {
      const privateAsyncMembers = getMembersInfo({ context: this })
         .filter(m => !m.isPublic && m.Id !== memberInfo.Id && m.isAsync && !m.isClass && !m.isContainerClass && m.enabled)
      for (const dependantMember of privateAsyncMembers) {
         await this[dependantMember.name].call(this, dependantMember.args);
         dependantMember.enabled = false;
      }
      try {
         const func = memberInfo.func[0];
         const output = await func.call(this, data);
         resolve(output);
      } catch (error) {
         if (memberInfo.errorHalt) {
            reject(error);
         } else {
            console.error(error);
            return resolve(memberInfo.errorReturn);
         }
      }
   });
}

const privateMemberEventCallback = async function ({ memberInfo, data }) {
   return new Promise(async (resolve, reject) => {
      for (const func of memberInfo.func) {
         try {
            const output = await func.call(this, data);
            resolve(output);
         } catch (error) {
            if (memberInfo.errorHalt) {
               reject(error);
            } else {
               console.error(error);
               return resolve(memberInfo.errorReturn);
            }
         }
      }
   });
}

const getInstances = ({ memberInfo }) => {
   return memberInstances.get(memberInfo.Id);
}
const setInstances = ({ memberInfo, instances }) => {
   memberInstances.delete(memberInfo.Id);
   memberInstances.set(memberInfo.Id, instances);
}
const getInstance = ({ memberInfo }) => {
   const instances = getInstances({ memberInfo });
   if (instances && instances.length === 1) {
      return instances[0];
   } else if (instances && instances.length > 0) {
      return instances;
   }
}
const getMembersInfo = ({ context }) => {
   if (!membersInfo.has(context.contextId)) {
      membersInfo.set(context.contextId, []);
   }
   return membersInfo.get(context.contextId);
}
const addToMembersInfo = ({ context, memberInfo }) => {
   return getMembersInfo({ context }).push(memberInfo);
}
const isPublicMemberEventRaised = ({ context, memberInfo }) => {
   if (!eventStack.has(context)) {
      eventStack.set(context, []);
   }
   const events = eventStack.get(context);
   const event = events.shift();
   let isRaised = false;
   if (event && event.contextId === context.contextId) {
      isRaised = true;
   }
   events.unshift(event);
   if (!event) {
      throw new Error(`Unable to access member: ${memberInfo.name}, no public members of ${context.constructor.name} were called`);
   }
   if (!isRaised) {
      throw new Error(`Unable to access member: ${memberInfo.name} on context ${event.contextId}, it is private to: ${context.contextId}`);
   }
}
const createMember = function ({ context, memberInfo }) {
   let raiseEvent = (data) => {
      return new Promise((resolve, reject) => { new MemberEvent({ memberInfo, data, promise: { resolve, reject }, context }); });
   }
   if (memberInfo.isClass || memberInfo.isContainerClass || memberInfo.isValueType) {
      return Object.defineProperty(context, memberInfo.name, { configurable: false, get: raiseEvent, set: raiseEvent });
   } else if (memberInfo.isPublic || memberInfo.isAsync) {
      return Object.defineProperty(context, memberInfo.name, { configurable: false, value: raiseEvent });
   }
   throw new Error(`could not create property for member: ${utils.getJSONString(memberInfo)}`);
}