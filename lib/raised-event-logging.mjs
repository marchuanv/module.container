import { Reference } from "./reference/reference.mjs";
export class RaisedEventLogging extends Reference {
   constructor() {
      super('raisedEventLogging');
   }
   /**
    * @param {ReferenceId} raisedEventRefId
    */
   push(raisedEventRefId) {
      this.dependency = raisedEventRefId;
   }
}
process.on('exit', () => {
   // let formattedMessages = [];
   // const raisedEvents = references.set(RaisedEvents, []);
   // for (const { message, context, microTime } of _messages) {
   //    const contextName = context.contextName;
   //    const contextId = context.contextId;
   //    const eventId = 'None';
   //    const memberName = 'Log';
   //    const memberId = 'None';
   //    formattedMessages.push({ microTime, contextName, contextId, memberName, memberId, eventId, message });
   // }
   // for (const { microTime, contextName, contextId, name, memberId, Id } of raisedEvents) {
   //    const memberName = name;
   //    const eventId = Id;
   //    const message = 'None';
   //    formattedMessages.push({ microTime, contextName, contextId, memberName, memberId, eventId, message });
   // }
   // for (const { microTime, contextName, contextId, memberName, memberId, eventId, message } of sortAsc(formattedMessages)) {
   //    console.log(`MicroTime: ${microTime}, ${contextName}(${contextId}), ${memberName}(${memberId}), Event Id: ${eventId}, \r\n -> Message: ${message}`);
   // }
});

function sortDesc(array) {
   return array.sort((msgA, msgB) => (msgB.microTime < msgA.microTime) ? -1 : ((msgB.microTime > msgA.microTime) ? 1 : 0));
}
function sortAsc(array) {
   return array.sort((msgA, msgB) => (msgA.microTime < msgB.microTime) ? -1 : ((msgA.microTime > msgB.microTime) ? 1 : 0));
}