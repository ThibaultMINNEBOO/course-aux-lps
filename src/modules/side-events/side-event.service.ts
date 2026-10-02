import { Injectable } from '@spraxium/common';
import type { SideEvent } from '../../generated/prisma/client';
import { DomainException } from '../../shared/domain.exception';
import { DatabaseService } from '../database/database.service';
import { recapAt } from '../seasons/season-period';

export interface CreateSideEventInput {
  name: string;
  description?: string;
  endsOn?: Date;
}

const AUTOCOMPLETE_LIMIT = 25;

@Injectable()
export class SideEventService {
  constructor(private readonly db: DatabaseService) {}

  async create(input: CreateSideEventInput, now = new Date()): Promise<SideEvent> {
    const endsAt = input.endsOn ? recapAt(input.endsOn) : undefined;
    if (endsAt && endsAt.getTime() <= now.getTime()) {
      throw new DomainException('La date de fin doit être dans le futur.');
    }
    return this.db.sideEvent.create({
      data: { name: input.name, description: input.description, startsAt: now, endsAt },
    });
  }

  async require(id: string): Promise<SideEvent> {
    const event = await this.db.sideEvent.findUnique({ where: { id } });
    if (!event) {
      throw new DomainException('Évènement introuvable. Sélectionne-le dans la liste proposée.');
    }
    return event;
  }

  async requireActive(id: string): Promise<SideEvent> {
    const event = await this.require(id);
    if (event.status !== 'ACTIVE') {
      throw new DomainException(`L'évènement **${event.name}** est terminé.`);
    }
    return event;
  }

  findActive(): Promise<Array<SideEvent>> {
    return this.db.sideEvent.findMany({ where: { status: 'ACTIVE' }, orderBy: { createdAt: 'asc' } });
  }

  findDue(now = new Date()): Promise<Array<SideEvent>> {
    return this.db.sideEvent.findMany({ where: { status: 'ACTIVE', endsAt: { lte: now } } });
  }

  close(event: SideEvent, now = new Date()): Promise<SideEvent> {
    return this.db.sideEvent.update({
      where: { id: event.id },
      data: { status: 'ENDED', endsAt: event.endsAt && event.endsAt < now ? event.endsAt : now },
    });
  }

  search(query: string, includeEnded: boolean): Promise<Array<SideEvent>> {
    return this.db.sideEvent.findMany({
      where: {
        name: { contains: query.trim(), mode: 'insensitive' },
        ...(includeEnded ? {} : { status: 'ACTIVE' }),
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      take: AUTOCOMPLETE_LIMIT,
    });
  }
}
