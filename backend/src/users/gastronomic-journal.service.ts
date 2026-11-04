import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { extname, join, resolve } from 'node:path';
import type { Content, TableCell } from 'pdfmake';
import { PrismaService } from '../prisma/prisma.service.js';

const uploadsRoot = resolve(process.cwd(), 'uploads');
const fontsRoot = join(process.cwd(), 'node_modules/pdfmake/fonts/Roboto');
const nodeRequire = createRequire(import.meta.url);
const pdfMake = nodeRequire('pdfmake') as typeof import('pdfmake');
type TDocumentDefinitions = Parameters<typeof pdfMake.createPdf>[0];

pdfMake.setFonts({
  Roboto: {
    normal: join(fontsRoot, 'Roboto-Regular.ttf'),
    bold: join(fontsRoot, 'Roboto-Medium.ttf'),
    italics: join(fontsRoot, 'Roboto-Italic.ttf'),
    bolditalics: join(fontsRoot, 'Roboto-MediumItalic.ttf'),
  },
});

@Injectable()
export class GastronomicJournalService {
  private readonly logger = new Logger(GastronomicJournalService.name);

  constructor(private readonly prisma: PrismaService) {}

  async generatePdf(userId: string): Promise<Buffer> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        posts: {
          include: { images: true },
          orderBy: { createdAt: 'desc' },
        },
        reviews: {
          include: { dish: { include: { restaurant: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const ratingsTotal = user.reviews.reduce((total, review) => total + review.rating, 0);
    const averageRating = user.reviews.length
      ? (ratingsTotal / user.reviews.length).toFixed(1)
      : '0.0';
    const photoCount = user.posts.reduce((total, post) => total + post.images.length, 0);
    const favoriteCuisine = this.getFavoriteCuisine(user.reviews);
    const content: Content[] = [
      {
        text: 'DIARIO GASTRONÓMICO',
        style: 'title',
      },
      {
        text: `Una colección de sabores de ${user.username}`,
        style: 'subtitle',
      },
      {
        text: `Miembro desde ${this.formatDate(user.createdAt)}`,
        style: 'metadata',
        margin: [0, 0, 0, 22],
      },
      {
        table: {
          widths: ['*', '*', '*', '*'],
          body: [[
            this.statCell('PLATOS VALORADOS', String(user.reviews.length)),
            this.statCell('MEDIA DE VALORACIÓN', `${averageRating}/5`),
            this.statCell('ENTRADAS', String(user.posts.length)),
            this.statCell('FOTOGRAFÍAS', String(photoCount)),
          ]],
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 24],
      },
      {
        text: 'Resumen de sabores',
        style: 'sectionTitle',
      },
      {
        text: favoriteCuisine
          ? `Tu cocina más explorada es ${favoriteCuisine}. Este diario reúne tus descubrimientos, valoraciones y momentos compartidos.`
          : 'Empieza a valorar platos y compartir entradas para construir tu diario gastronómico.',
        style: 'body',
        margin: [0, 0, 0, 18],
      },
    ];

    if (user.reviews.length) {
      content.push({ text: 'Platos destacados', style: 'sectionTitle' });
      const reviewRows: TableCell[][] = [
        [
          { text: 'PLATO', style: 'tableHeader' },
          { text: 'RESTAURANTE', style: 'tableHeader' },
          { text: 'NOTA', style: 'tableHeader', alignment: 'right' },
        ],
        ...user.reviews.slice(0, 12).map((review): TableCell[] => [
          { text: review.dish.name },
          { text: review.dish.restaurant.name },
          { text: `${review.rating}/5`, alignment: 'right' },
        ]),
      ];
      content.push({
        table: {
          widths: ['*', '*', 55],
          headerRows: 1,
          body: reviewRows,
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 24],
      });
    }

    content.push({ text: 'Entradas del diario', style: 'sectionTitle' });
    if (!user.posts.length) {
      content.push({
        text: 'Todavía no hay entradas publicadas.',
        style: 'body',
      });
    } else {
      for (const post of user.posts) {
        content.push(await this.createPostSection(post));
      }
    }

    const documentDefinition: TDocumentDefinitions = {
      pageSize: 'A4',
      pageMargins: [42, 42, 42, 48],
      defaultStyle: {
        font: 'Roboto',
        color: '#27332f',
        fontSize: 10,
      },
      styles: {
        title: {
          fontSize: 27,
          bold: true,
          color: '#193b31',
          characterSpacing: 1.2,
        },
        subtitle: {
          fontSize: 14,
          color: '#9a5d38',
          margin: [0, 5, 0, 4],
        },
        metadata: {
          fontSize: 9,
          color: '#718078',
        },
        sectionTitle: {
          fontSize: 16,
          bold: true,
          color: '#193b31',
          margin: [0, 8, 0, 10],
        },
        body: {
          fontSize: 10,
          lineHeight: 1.35,
          color: '#4c5b55',
        },
        tableHeader: {
          bold: true,
          fontSize: 8,
          color: '#718078',
        },
        postTitle: {
          fontSize: 13,
          bold: true,
          color: '#193b31',
        },
        postDate: {
          fontSize: 8,
          color: '#9a5d38',
        },
      },
      footer: (currentPage: number, pageCount: number) => ({
        text: `Diario gastronómico de ${user.username}  ·  ${currentPage}/${pageCount}`,
        alignment: 'center',
        color: '#718078',
        fontSize: 8,
        margin: [0, 18, 0, 0],
      }),
      content,
    };

    return pdfMake.createPdf(documentDefinition).getBuffer();
  }

  private async createPostSection(post: {
    title: string;
    content: string;
    createdAt: Date;
    images: { url: string }[];
  }): Promise<Content> {
    const images = await Promise.all(post.images.slice(0, 4).map((image) => this.readImage(image.url)));
    const imageColumns = images.filter((image): image is string => image !== null).map((image) => ({
      image,
      width: 115,
      height: 82,
      fit: [115, 82] as [number, number],
      margin: [0, 8, 8, 0] as [number, number, number, number],
    }));

    return {
      stack: [
        {
          columns: [
            { text: post.title, style: 'postTitle' },
            { text: this.formatDate(post.createdAt), style: 'postDate', alignment: 'right' },
          ],
        },
        { text: post.content, style: 'body', margin: [0, 5, 0, 0] },
        ...(imageColumns.length ? [{ columns: imageColumns }] : []),
      ],
      margin: [0, 0, 0, 18],
    };
  }

  private async readImage(url: string): Promise<string | null> {
    if (!url.startsWith('/uploads/')) {
      this.logger.warn(`Skipping non-local journal image: ${url}`);
      return null;
    }

    const filePath = resolve(process.cwd(), `.${url}`);
    if (!filePath.startsWith(`${uploadsRoot}/`)) {
      this.logger.warn(`Skipping unsafe journal image path: ${url}`);
      return null;
    }

    const extension = extname(filePath).toLowerCase();
    const mime = extension === '.png' ? 'image/png' : extension === '.jpg' || extension === '.jpeg' ? 'image/jpeg' : null;
    if (!mime) {
      this.logger.warn(`Skipping unsupported journal image: ${url}`);
      return null;
    }

    try {
      const file = await readFile(filePath);
      return `data:${mime};base64,${file.toString('base64')}`;
    } catch (error) {
      this.logger.warn(`Could not read journal image ${url}: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  private getFavoriteCuisine(reviews: { dish: { restaurant: { cuisine: string } } }[]): string | null {
    const counts = new Map<string, number>();
    for (const review of reviews) {
      const cuisine = review.dish.restaurant.cuisine;
      counts.set(cuisine, (counts.get(cuisine) ?? 0) + 1);
    }
    return [...counts.entries()].sort((first, second) => second[1] - first[1])[0]?.[0] ?? null;
  }

  private statCell(label: string, value: string): TableCell {
    return {
      stack: [
        { text: value, bold: true, fontSize: 15, color: '#193b31' },
        { text: label, fontSize: 7, color: '#718078', margin: [0, 3, 0, 0] },
      ],
      fillColor: '#edf3ef',
      margin: [8, 9, 8, 9],
    };
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(date);
  }
}
