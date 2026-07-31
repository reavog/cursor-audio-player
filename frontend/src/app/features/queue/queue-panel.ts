import { Component, computed, inject, signal } from "@angular/core";
import { AudioPlayerService } from "../../core/services/audio-player.service";
import { MusicLibraryService } from "../../core/services/music-library.service";
import { formatDuration } from "../../shared/utils/format-duration";
import { EmptyState } from "../../shared/components/empty-state/empty-state";
import { AlbumArtwork } from "../../shared/components/album-artwork/album-artwork";
import { IconButton } from "../../shared/components/icon-button/icon-button";
import { Song } from "../../core/models/song.model";
import { QueueItem } from "../../core/models/queue.model";

interface QueueRow {
  item: QueueItem;
  song: Song | null;
  active: boolean;
  index: number;
}

@Component({
  selector: "app-queue-panel",
  imports: [AlbumArtwork, EmptyState, IconButton],
  templateUrl: "./queue-panel.html",
  styleUrls: ["./queue-panel.scss"],
})
export class QueuePanel {
  private readonly player = inject(AudioPlayerService);
  private readonly library = inject(MusicLibraryService);

  readonly queueCount = this.player.queueCount;
  readonly remainingDuration = this.player.remainingDuration;
  readonly remainingLabel = computed(() => formatDuration(this.remainingDuration()));

  readonly dragFromIndex = signal<number | null>(null);
  readonly dropTargetIndex = signal<number | null>(null);

  readonly rows = computed<QueueRow[]>(() => {
    const queue = this.player.queue();
    const index = this.player.queueIndex();

    return queue.map((item, itemIndex) => ({
      item,
      song: this.library.getSongById(item.songId) ?? null,
      active: itemIndex === index,
      index: itemIndex,
    }));
  });

  clearQueue(): void {
    this.player.clearQueue();
  }

  playItem(queueId: string): void {
    void this.player.playQueueItem(queueId);
  }

  removeItem(queueId: string, event: MouseEvent): void {
    event.stopPropagation();
    this.player.removeFromQueue(queueId);
  }

  moveItem(fromIndex: number, direction: -1 | 1, event: MouseEvent): void {
    event.stopPropagation();
    this.player.reorderQueue(fromIndex, fromIndex + direction);
  }

  onDragStart(index: number, event: DragEvent): void {
    this.dragFromIndex.set(index);
    this.dropTargetIndex.set(index);
    event.dataTransfer?.setData("text/plain", String(index));
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
    }
  }

  onDragOver(index: number, event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "move";
    }
    if (this.dragFromIndex() === null) {
      return;
    }
    this.dropTargetIndex.set(index);
  }

  onDrop(index: number, event: DragEvent): void {
    event.preventDefault();
    const fromIndex = this.dragFromIndex();
    if (fromIndex === null) {
      return;
    }

    this.player.reorderQueue(fromIndex, index);
    this.resetDragState();
  }

  onDragEnd(): void {
    this.resetDragState();
  }

  formatSongDuration(song: Song | null): string {
    return formatDuration(song?.duration ?? 0);
  }

  private resetDragState(): void {
    this.dragFromIndex.set(null);
    this.dropTargetIndex.set(null);
  }
}
