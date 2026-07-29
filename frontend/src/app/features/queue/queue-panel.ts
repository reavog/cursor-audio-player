import { Component, computed, inject } from "@angular/core";
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

  readonly rows = computed<QueueRow[]>(() => {
    const queue = this.player.queue();
    const index = this.player.queueIndex();

    return queue.map((item, itemIndex) => ({
      item,
      song: this.library.getSongById(item.songId) ?? null,
      active: itemIndex === index,
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

  formatSongDuration(song: Song | null): string {
    return formatDuration(song?.duration ?? 0);
  }
}
