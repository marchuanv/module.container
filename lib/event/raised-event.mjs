import { Container } from "../container.mjs";
import { Reference } from "../reference/reference.mjs";
import { ReferenceId } from "../reference/referenceId.mjs";
import { MemberEvent } from "./member-event.mjs";
const privateBag = new WeakMap();
export class RaisedEvent extends Reference {
    /**
     * @param {ReferenceId} memberEventRefId
     * @param {Object} data
     */
    constructor(memberEventRefId) {
        super(`raised_${memberEventRefId.name}`);
        super.addReference(memberEventRefId, MemberEvent.prototype);
        const container = super.getReference(Container.prototype);
        const microTime = process.hrtime.bigint();
        const containerName = container.name;
        const containerId = container.Id;
        const date = new Date();
        privateBag.set(this, {
            microTime,
            containerName,
            containerId,
            date
        });
    }
    /**
     * @returns {ReferenceId}
     */
    get memberEventId() {
        const memberEvent = super.getReference(MemberEvent.prototype);
        return memberEvent.Id;
    }
}