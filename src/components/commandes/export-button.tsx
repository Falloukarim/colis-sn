// components/commandes/export-button.tsx
'use client';

import { useState } from 'react';
import { Download, FileText, Sheet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Commande } from '@/types/database.types';
import { toast } from 'sonner';

interface ExportButtonProps {
  commandes: Commande[];
  filters?: {
    search?: string;
    status?: string;
  };
}

export function ExportButton({ commandes, filters }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const exportToPDF = async () => {
    setExporting(true);
    try {
      // Générer un PDF avec jsPDF ou une autre librairie
      const { jsPDF } = await import('jspdf');
      const autoTable = await import('jspdf-autotable');
      
      const doc = new jsPDF();
      
      // En-tête
      doc.setFontSize(20);
      doc.text('Rapport des Commandes', 14, 15);
      
      // Informations de filtrage
      doc.setFontSize(10);
      doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 14, 25);
      if (filters?.search) {
        doc.text(`Recherche: ${filters.search}`, 14, 30);
      }
      if (filters?.status) {
        doc.text(`Statut: ${filters.status}`, 14, 35);
      }
      
      // Tableau des commandes
      const tableData = commandes.map(commande => [
        commande.numero_commande || 'N/A',
        (commande as any).client_nom || 'N/A',
        commande.statut,
        commande.poids ? `${commande.poids} kg` : 'N/A',
        commande.montant_total ? `${commande.montant_total} XOF` : 'N/A',
        new Date(commande.created_at).toLocaleDateString('fr-FR')
      ]);

      (doc as any).autoTable({
        startY: 40,
        head: [['N° Commande', 'Client', 'Statut', 'Poids', 'Montant', 'Date']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] }
      });

      // Sauvegarder le PDF
      doc.save(`commandes-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast.success('PDF exporté avec succès');
    } catch (error) {
      console.error('Erreur export PDF:', error);
      toast.error('Erreur lors de l\'export PDF');
    } finally {
      setExporting(false);
    }
  };

  const exportToExcel = async () => {
    setExporting(true);
    try {
      const XLSX = await import('xlsx');
      
      // Préparer les données
      const data = commandes.map(commande => ({
        'N° Commande': commande.numero_commande || 'N/A',
        'Client': (commande as any).client_nom || 'N/A',
        'Téléphone': (commande as any).client_telephone || 'N/A',
        'Statut': commande.statut,
        'Poids (kg)': commande.poids || 'N/A',
        'Prix/kg (XOF)': commande.prix_kg || 'N/A',
        'Montant Total (XOF)': commande.montant_total || 'N/A',
        'Date Réception': new Date(commande.created_at).toLocaleDateString('fr-FR'),
        'Date Livraison Prévue': commande.date_livraison_prevue 
          ? new Date(commande.date_livraison_prevue).toLocaleDateString('fr-FR')
          : 'N/A',
        'Description': commande.description || 'N/A'
      }));

      // Créer le workbook
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(data);
      
      // Ajouter le worksheet au workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Commandes');
      
      // Exporter
      XLSX.writeFile(workbook, `commandes-${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast.success('Excel exporté avec succès');
    } catch (error) {
      console.error('Erreur export Excel:', error);
      toast.error('Erreur lors de l\'export Excel');
    } finally {
      setExporting(false);
    }
  };

  const exportToCSV = () => {
    try {
      // Préparer les en-têtes CSV
      const headers = ['N° Commande', 'Client', 'Statut', 'Poids', 'Montant', 'Date'];
      const csvData = commandes.map(commande => [
        commande.numero_commande || 'N/A',
        (commande as any).client_nom || 'N/A',
        commande.statut,
        commande.poids || 'N/A',
        commande.montant_total || 'N/A',
        new Date(commande.created_at).toLocaleDateString('fr-FR')
      ]);

      // Créer le contenu CSV
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(field => `"${field}"`).join(','))
      ].join('\n');

      // Créer et télécharger le fichier
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `commandes-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('CSV exporté avec succès');
    } catch (error) {
      console.error('Erreur export CSV:', error);
      toast.error('Erreur lors de l\'export CSV');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2" disabled={exporting}>
          {exporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Exporter
          {exporting && '...'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={exportToExcel} className="flex items-center gap-2">
          <Sheet className="h-4 w-4" />
          Excel (Données complètes)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToCSV} className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          CSV (Simple)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}