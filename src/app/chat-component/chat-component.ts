import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Message } from '../../Models/message';
import { ChatSession } from '../../Models/chat-session';
import { OcrService } from '../../Services/ocr-service';
import { StorageService } from '../../Services/storage-service';
import { SanitizePipe } from '../../Pipes/sanitize.pipe';
import {BankInfo, ClientInfo, InvoiceData, InvoiceItem, VendorInfo} from '../../Models/Invoice';
import {ProductDatabaseService} from '../../Services/product-database-service';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-chat-component',
  standalone: true,
  imports: [CommonModule, FormsModule, SanitizePipe],
  templateUrl: 'chat-component.html',
  styleUrl: 'chat-component.css',
})
export class ChatComponent implements OnInit {
  @ViewChild('invoiceTemplate') invoiceTemplateRef!: ElementRef;
  sidebarOpen = true;
  chatSessions: ChatSession[] = [];
  currentSession: ChatSession | null = null;
  userInput = '';
  isProcessing = false;
  ocrProgress = 0;
  currentInvoiceData: InvoiceData | null = null;

  constructor(private ocr: OcrService,
              private storage: StorageService,
              private productDb: ProductDatabaseService) {}

  ngOnInit() {
    this.chatSessions = this.storage.loadAllSessions();
    if (!this.chatSessions.length) {
      this.createNewChat();
    } else {
      this.selectSession(this.chatSessions[0]);
    }
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  formatTime(date: Date) {
    return new Date(date).toLocaleString();
  }

  createNewChat() {
    const session = this.storage.createSession();
    this.chatSessions.unshift(session);
    this.selectSession(session);
  }

  selectSession(session: ChatSession) {
    this.currentSession = this.storage.selectSession(session.id);
  }

  deleteSession(session: ChatSession, e?: Event) {
    if (e) e.stopPropagation();
    this.storage.deleteSession(session.id);
    this.chatSessions = this.storage.loadAllSessions();
    if (this.currentSession?.id === session.id) {
      this.currentSession = this.chatSessions[0] || null;
    }
  }

  sendMessage() {
    const text = this.userInput.trim();
    if (!text || !this.currentSession) return;

    const msg: Message = {
      id: this.storage.newId(),
      text,
      isUser: true,
      timestamp: new Date()
    };
    this.storage.appendMessage(this.currentSession.id, msg);
    this.userInput = '';
    this.refreshSession();

    // --- DETECTION FACTURE ---
    if (this.isInvoiceIntent(text)) {
      // Si aucune donnée n'est disponible (pas d’OCR ni d’analyse précédente)
      if (!this.currentInvoiceData) {
        this.storage.appendMessage(this.currentSession.id, {
          id: this.storage.newId(),
          text: '🔍 Analyse des données pour générer votre facture...',
          isUser: false,
          timestamp: new Date()
        });
        this.refreshSession();

        try {
          // Analyse avancée du texte (simulation OCR ou texte libre)
          this.currentInvoiceData = this.parseInvoiceData(text);

          // Vérifie la validité des données extraites
          if (
            this.currentInvoiceData &&
            this.currentInvoiceData.items.length > 0 &&
            this.currentInvoiceData.total > 0
          ) {
            this.storage.appendMessage(this.currentSession.id, {
              id: this.storage.newId(),
              text: `✅ Données de facture extraites : ${this.currentInvoiceData.items.length} produit(s), Total: ${this.currentInvoiceData.total.toFixed(2)} €.`,
              isUser: false,
              timestamp: new Date()
            });
            this.refreshSession();
            setTimeout(() => this.generateInvoicePdf(), 700);
            return;
          } else {
            // Analyse échouée
            this.storage.appendMessage(this.currentSession.id, {
              id: this.storage.newId(),
              text: '❌ Impossible de trouver des éléments valides dans le texte. Veuillez formater le texte comme : "Produit: X, Quantité: 2, Prix: 15€".',
              isUser: false,
              timestamp: new Date()
            });
            this.refreshSession();
            return;
          }
        } catch (e) {
          console.error('Erreur d’analyse OCR:', e);
          this.storage.appendMessage(this.currentSession.id, {
            id: this.storage.newId(),
            text: '⚠️ Erreur d’analyse du texte. Veuillez réessayer ou uploader une image lisible.',
            isUser: false,
            timestamp: new Date()
          });
          this.refreshSession();
          return;
        }
      } else {
        // Des données sont déjà présentes (extraites via OCR)
        this.storage.appendMessage(this.currentSession.id, {
          id: this.storage.newId(),
          text: `🧾 Génération du PDF pour la facture ${this.currentInvoiceData.invoiceRef}...`,
          isUser: false,
          timestamp: new Date()
        });
        this.refreshSession();
        setTimeout(() => this.generateInvoicePdf(), 700);
        return;
      }
    }

    // --- Réponse standard ---
    const botMsg: Message = {
      id: this.storage.newId(),
      text: 'Merci ! Si vous appliquez votre Data, je vous informerai pour obtenir votre document. Merci de taper [\n' +
        '      \'Can you give me the invoice ?\n' +
        '      \'generate my pdf facture,\n' +
        '     ] . Ensuite, je vous transmets ton résultat.' +
        ' Tu peux ausssi uploader une image (note, facture, ou texte libre) pour générer automatiquement ta facture.',
      isUser: false,
      timestamp: new Date()
    };
    this.storage.appendMessage(this.currentSession.id, botMsg);
    this.refreshSession();
  }

  isInvoiceIntent(text: string): boolean {
    const lowerText = text.toLowerCase().trim();
    const invoiceTriggers = [
      'donner le facture',
      'donner moi mon facture',
      'can you give me the invoice',
      'generate my pdf facture',
      'créer pdf',
      'générer la facture'
    ];
    return invoiceTriggers.some(trigger => lowerText.includes(trigger));
  }

  refreshSession() {
    if (this.currentSession)
      this.currentSession = this.storage.getSession(this.currentSession.id);
  }

  async onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.currentSession) return;

    // --- File Handling ---
    const base64 = await this.readFileAsBase64(file);
    await this.storage.saveFile(this.currentSession.id, file.name, base64, file.type);

    const uploadMsg: Message = {
      id: this.storage.newId(),
      text: `📎 Fichier téléchargé : ${file.name}`,
      isUser: true,
      timestamp: new Date(),
      fileAttachment: { name: file.name, type: file.type, url: base64 }
    };
    this.storage.appendMessage(this.currentSession.id, uploadMsg);
    this.refreshSession();

    // --- OCR Process ---
    this.isProcessing = true;
    try {
      // Utilisez recognizeWithMultipleAttempts si votre OcrService le supporte, sinon recognizeFromBase64
      const text = await this.ocr.recognizeFromBase64(base64, p => this.ocrProgress = Math.round(p * 100));
      const cleaned = text.trim().replace(/\n{3,}/g, '\n\n');

      // --- CRITICAL: Call the deep analysis parser after successful OCR ---
      this.currentInvoiceData = this.parseInvoiceData(cleaned);

      console.log('currentInvoiceData => ' , this.currentInvoiceData);
      // ------------------------------------------------------------------

      let responseText = `✅ Analyse OCR terminée! **Facture Réf:** ${this.currentInvoiceData.invoiceRef}. `;
      responseText += `💰 **Total trouvé:** ${this.currentInvoiceData.total.toFixed(2)}€\n\n`;
      responseText += `Tapez "**donner le facture**" pour générer le PDF.\n\n`;
      responseText += `***Texte extrait:***\n\n${cleaned}`;

      const botMsg: Message = {
        id: this.storage.newId(),
        text: responseText,
        isUser: false,
        timestamp: new Date()
      };
      this.storage.appendMessage(this.currentSession.id, botMsg);
    } catch (err) {
      let errorMessage: string;
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        errorMessage = (err as { message: string }).message;
      } else {
        errorMessage = String(err);
      }

      const botError: Message = {
        id: this.storage.newId(),
        text: `❌ Erreur OCR : ${errorMessage}`,
        isUser: false,
        timestamp: new Date()
      };
      this.storage.appendMessage(this.currentSession.id, botError);
    } finally {
      this.isProcessing = false;
      this.ocrProgress = 0;
      this.refreshSession();
      input.value = '';
    }
  }
  async generateInvoicePdf() {

    console.log('generateInvoicePdf currentInvoiceData => ', this.currentInvoiceData);
    console.log('generateInvoicePdf invoiceTemplateRef => ', this.invoiceTemplateRef);
    if (!this.invoiceTemplateRef || !this.currentInvoiceData) {
      this.storage.appendMessage(this.currentSession!.id, {
        id: this.storage.newId(),
        text: '❌ Erreur: Les données de facture sont manquantes pour la génération du PDF.',
        isUser: false,
        timestamp: new Date()
      });
      this.refreshSession();
      return;
    }

    const element = this.invoiceTemplateRef.nativeElement;

    try {
      // ÉTAPE CLÉ 1: Rendre l'élément visible pour que html2canvas puisse capturer les dimensions
      // On retire le 'display: none' et on s'assure qu'il n'est pas dans le flux normal (ex: position absolue hors écran)
      element.style.display = 'block';
      element.style.position = 'absolute';
      element.style.left = '-9999px'; // Place l'élément hors écran

      // Délai légèrement augmenté pour s'assurer que le DOM est stable et que les dimensions sont calculées
      await new Promise(resolve => setTimeout(resolve, 100));

      // AJOUT DES OPTIONS DE ROBUSTESSE POUR IGNORER LE LOGO NON TROUVÉ (404)
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        // LOGIQUE : Ignorer l'élément si c'est l'image du logo qui pose problème
        ignoreElements: (node) => {
          // Si l'élément est une balise IMG et que son chemin source est celui du logo, on l'ignore.
          // Cette logique permet de contourner le 404 qui corrompt le canvas.
          if (node instanceof HTMLImageElement && node.src.includes('logoInvoice.png')) {
            console.warn(`Ignorant l'image: ${node.src} pour éviter l'erreur "wrong PNG signature".`);
            return true;
          }
          // Ignorer également les images utilisant ngSrc si elles ne sont pas dans l'arbre d'exécution Angular standard
          if (node instanceof HTMLImageElement && node.getAttribute('ngSrc') !== null) {
            console.warn(`Ignorant l'image ngSrc pour éviter des erreurs de chargement dans html2canvas.`);
            return true;
          }
          return false;
        }
        // ***********************************************************************************
      });

      // Si la capture réussit, on obtient la DataURL JPEG (plus robuste que PNG en cas d'erreur de chargement)
      // CHANGEMENT 1: Conversion en JPEG pour une meilleure tolérance aux erreurs.
      const imgData = canvas.toDataURL('image/jpeg', 1.0);

      const pdf = new jsPDF('p', 'pt', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();

      // ***************************************************************
      // CORRECTION : VÉRIFICATION DES DIMENSIONS DU CANVAS AVANT LE CALCUL
      // Cette vérification est conservée pour la robustesse, mais ne devrait plus être déclenchée.
      let pdfHeight;

      if (canvas.height > 0 && canvas.width > 0) {
        const imgProps = canvas.width / canvas.height;
        pdfHeight = pdfWidth / imgProps;
      } else {
        // Taille par défaut si le canvas est invalide (pour éviter une erreur critique)
        console.error('Canvas dimensions are invalid, using default height.');
        pdfHeight = pdfWidth * 1.414; // Ratio A4 par défaut
      }
      // ***************************************************************

      // CHANGEMENT 2: Spécifier 'JPEG' comme format pour addImage.
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`invoice_${this.currentInvoiceData.invoiceRef}.pdf`);

      const botMsg: Message = {
        id: this.storage.newId(),
        text: `✅ Facture PDF générée avec succès!\n\n📋 Ref: ${this.currentInvoiceData.invoiceRef}\n💰 Total: ${this.currentInvoiceData.total.toFixed(2)}€`,
        isUser: false,
        timestamp: new Date()
      };
      this.storage.appendMessage(this.currentSession!.id, botMsg);

    } catch (error) {
      console.error("PDF Generation Error:", error);
      this.storage.appendMessage(this.currentSession!.id, {
        id: this.storage.newId(),
        text: `❌ Erreur lors de la création du PDF. L'erreur "wrong PNG signature" est souvent due à une image non trouvée (404) dans le template de facture. Le logo a été temporairement ignoré pour permettre la génération. (Tentative de conversion en JPEG pour plus de robustesse.)`,
        isUser: false,
        timestamp: new Date()
      });
    } finally {
      // ÉTAPE CLÉ 2: Rendre l'élément à nouveau invisible après la capture
      element.style.display = 'none';
      element.style.position = 'static';
      element.style.left = 'auto';
      this.refreshSession();
    }
  }


  parseInvoiceData(ocrText: string): InvoiceData {
    console.log('🔍 Starting deep OCR analysis with vendor/client/bank parsing...');

    // === Helper Functions ===
    const cleanNumber = (text: string): number => {
      const cleaned = text.replace(/[^\d.,]/g, '').replace(',', '.');
      const num = parseFloat(cleaned);
      return isNaN(num) ? 0 : num;
    };

    const extractString = (patterns: RegExp[]): string => {
      for (const pattern of patterns) {
        const match = ocrText.match(pattern);
        if (match && match[match.length - 1]) {
          return match[match.length - 1].trim();
        }
      }
      return 'N/A';
    };

    const extractNumber = (patterns: RegExp[]): number => {
      for (const pattern of patterns) {
        const match = ocrText.match(pattern);
        if (match && match[match.length - 1]) {
          return cleanNumber(match[match.length - 1]);
        }
      }
      return 0;
    };

    // === Core Fields ===
    const buyerName = extractString([
      /Client\s*:?[\s\n]*([A-Z][A-Za-z\s\-\']+)/i,
      /Nom\s*:?[\s\n]*([A-Z][A-Za-z\s\-\']+)/i,
      /Billed?\s*To\s*:?[\s\n]*([A-Z][A-Za-z\s\-\']+)/i
    ]);

    const total = extractNumber([/(?:Total\s*(?:TTC)?|Prix total)\s*:?\s*([\d\.,]+)/i]);
    const tax = extractNumber([/(?:TVA|Tax)\s*:?\s*([\d\.,]+)/i]);
    const pricePerUnit = extractNumber([/Prix\s*(?:unitaire|par pièce)\s*:?\s*([\d\.,]+)/i]);

    const dateStr = extractString([
      /Date\s*(?:de facturation|de livraison)?\s*:?\s*(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4})/i
    ]);
    const invoiceDate = dateStr !== 'N/A' ? new Date(dateStr) : new Date();

    // === Vendor Info Extraction ===
    const vendorInfo: VendorInfo = {
      name: extractString([
        /Vendeur\s*:?[\s\n]*(.+)/i,
        /Société\s*:?[\s\n]*(.+)/i
      ]),
      address: extractString([
        /Adresse\s*:?[\s\n]*(.+)/i
      ]),
      city: extractString([
        /(?:Ville|Code postal)\s*:?[\s\n]*(.+)/i
      ]),
      siret: extractString([
        /SIRET\s*:?[\s\n]*([0-9\s]+)/i
      ]),
      tva: extractString([
        /TVA\s*(?:Intra)?\s*:?[\s\n]*([A-Z0-9\s]+)/i
      ]),
      phone: extractString([
        /Téléphone\s*:?[\s\n]*([\+0-9\s\.]+)/i,
        /Tel\s*:?[\s\n]*([\+0-9\s\.]+)/i
      ]),
      email: extractString([
        /E[- ]?mail\s*:?[\s\n]*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,})/i
      ]),
      website: extractString([
        /(?:Site|Website)\s*:?[\s\n]*(https?:\/\/[^\s]+)/i,
        /(?:Site|Website)\s*:?[\s\n]*([A-Za-z0-9\.\-]+\.[a-z]{2,})/i
      ])
    };

    // === Client Info Extraction ===
    const clientInfo: ClientInfo = {
      address: extractString([
        /Adresse client\s*:?[\s\n]*(.+)/i,
        /Adresse\s*:?[\s\n]*(.+)/i
      ]),
      city: extractString([
        /Ville client\s*:?[\s\n]*(.+)/i,
        /(?:Code postal|Ville)\s*:?[\s\n]*(.+)/i
      ])
    };

    // === Bank Info Extraction ===
    const bankInfo: BankInfo = {
      bank: extractString([
        /Banque\s*:?[\s\n]*(.+)/i
      ]),
      iban: extractString([
        /IBAN\s*:?[\s\n]*([A-Z0-9\s]+)/i
      ]),
      bic: extractString([
        /(?:BIC|SWIFT)\s*:?[\s\n]*([A-Z0-9]+)/i
      ])
    };
    // === Additional Metadata Extraction ===
    const dueDateStr = extractString([
      /Échéance\s*:?\s*(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4})/i,
      /Due\s*Date\s*:?\s*(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4})/i
    ]);
    const dueDate = dueDateStr !== 'N/A' ? new Date(dueDateStr) : undefined;

    const paymentTerms = extractString([
      /Conditions?\s*de\s*paiement\s*:?\s*([A-Za-z0-9\s]+)/i,
      /Paiement\s*:?\s*([A-Za-z0-9\s]+)/i,
      /Payment\s*Terms\s*:?\s*([A-Za-z0-9\s]+)/i
    ]);
    const reference = extractString([
      /Référence\s*:?\s*([A-Z0-9\-]+)/i,
      /Ref\.?\s*:?\s*([A-Z0-9\-]+)/i
    ]);
    const additionalInfo = extractString([
      /Informations?\s*additionnelles?\s*:?\s*([\s\S]+)/i,
      /Notes?\s*:?\s*([\s\S]+)/i
    ]);

    // === Item Extraction Logic ===
    const items: InvoiceItem[] = [];
    const commandLine = extractString([/Commande\s*:?\s*(.*)/i]);

    if (commandLine !== 'N/A') {
      const baseMatch = commandLine.match(/(\d+)\s*([a-zA-Z0-9\s]+?)(?:,|$)/);
      if (baseMatch) {
        const totalQty = parseInt(baseMatch[1]);
        const baseProduct = baseMatch[2].trim();
        const match = this.productDb.findBestMatch(baseProduct, 0.6);

        const colorDetailsMatch = commandLine.match(/couleurs\s*:?\s*(.*)/i);
        if (colorDetailsMatch && colorDetailsMatch[1].length > 0) {
          const colors = colorDetailsMatch[1].split(',').map(s => s.trim());
          for (const detail of colors) {
            const detailMatch = detail.match(/(\d+)\s*([a-zA-Z\s]+)/);
            if (detailMatch) {
              const qty = parseInt(detailMatch[1]);
              const color = detailMatch[2].trim();

              items.push({
                name: `${baseProduct} (${color})`,
                ref: this.generateRef(match?.category),
                qty: qty,
                price: pricePerUnit || (total / totalQty) || 0,
                category: match?.category,
                confidence: match?.confidence
              });
            }
          }
        } else {
          items.push({
            name: baseProduct,
            ref: this.generateRef(match?.category),
            qty: totalQty,
            price: pricePerUnit || (total / totalQty) || 0,
            category: match?.category,
            confidence: match?.confidence
          });
        }
      }
    }

    // === Totals ===
    const calculatedSubTotal = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const calculatedTax = tax;
    const calculatedTotal = calculatedSubTotal + calculatedTax;

    const result: InvoiceData = {
      buyerName: buyerName || 'Unknown Customer',
      invoiceRef: extractString([/Facture\s*(?:n°|numéro)?\s*:?[\s\n]*([A-Z0-9\-]+)/i]) || `INV-${Date.now()}`,
      invoiceDate: invoiceDate,
      subTotal: calculatedSubTotal,
      tax: calculatedTax,
      total: total > 0 ? total : calculatedTotal,
      items: items.filter(item => item.price > 0 && item.qty > 0),
      vendorInfo,
      clientInfo,
      bankInfo,
      dueDate,
      paymentTerms: paymentTerms !== 'N/A' ? paymentTerms : 'À réception',
      reference: reference !== 'N/A' ? reference : '',
      additionalInfo: additionalInfo !== 'N/A' ? additionalInfo : ''
    };

    console.log('✅ Parsed full invoice data:', result);
    return result;
  }

  // Génère une référence de produit basique
  generateRef(category?: string): string {
    const prefix = category ? category.substring(0, 3).toUpperCase() : 'PRD';
    return `${prefix}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }

  readFileAsBase64(file: File): Promise<string> {
    return new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = () => res(reader.result as string);
      reader.onerror = rej;
      reader.readAsDataURL(file);
    });
  }

  async downloadAttachment(sessionId: string, filename: string) {
    const fileData = await this.storage.getFile(sessionId, filename);
    if (!fileData) return alert('Fichier introuvable.');
    const link = document.createElement('a');
    link.href = fileData.url;
    link.download = fileData.name;
    link.click();
  }
}
