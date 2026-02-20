# Bilingual Government Services Knowledge Base
# Supports: English (en) and Tagalog (tl)

KNOWLEDGE_BASE = {
    'business_permit': {
        'topics': [
            'business permit', 'new permit', 'renewal', 'mayor\'s permit',
            'negosyo', 'permiso', 'pagnegosyo', 'lisensya'
        ],
        'keywords': [
            'business', 'permit', 'renewal', 'negosyo', 'permiso', 'lisensya'
        ],
        'responses': {
            'en': (
                "**Business Permit Application / Renewal**\n\n"
                "**Requirements:**\n"
                "1. Barangay Clearance\n"
                "2. DTI / SEC Registration\n"
                "3. Contract of Lease (if renting)\n"
                "4. Cedula (Community Tax Certificate)\n"
                "5. Sanitary Permit\n\n"
                "**Office:** Business Permit & Licensing Office (BPLO)\n"
                "**Schedule:** Mon-Fri, 8:00 AM - 5:00 PM\n\n"
                "Need anything else?"
            ),
            'tl': (
                "**Pagkuha / Pag-renew ng Business Permit**\n\n"
                "**Mga Kailangan:**\n"
                "1. Barangay Clearance\n"
                "2. DTI / SEC Registration\n"
                "3. Kontrata ng Upa (kung nangungupahan)\n"
                "4. Cedula (Community Tax Certificate)\n"
                "5. Sanitary Permit\n\n"
                "**Opisina:** Business Permit & Licensing Office (BPLO)\n"
                "**Oras:** Lunes-Biyernes, 8:00 AM - 5:00 PM\n\n"
                "May iba ka pa bang tanong?"
            )
        }
    },

    'civil_registry': {
        'topics': [
            'birth certificate', 'marriage', 'death certificate', 'cenomar', 'psa',
            'kapanganakan', 'kasal', 'kamatayan', 'sertipiko'
        ],
        'keywords': [
            'birth', 'marriage', 'death', 'certificate', 'registry', 'cenomar',
            'kapanganakan', 'kasal', 'kamatayan', 'sertipiko'
        ],
        'responses': {
            'en': (
                "**Civil Registry Services**\n\n"
                "**Birth / Marriage / Death Certificates:**\n"
                "- Bring valid ID + authorization letter (if not the owner)\n"
                "- Processing: 3-5 working days\n"
                "- Fee: ₱150 per copy\n\n"
                "**CENOMAR / PSA copies** can also be requested.\n\n"
                "Need more details?"
            ),
            'tl': (
                "**Mga Serbisyo sa Civil Registry**\n\n"
                "**Birth / Marriage / Death Certificate:**\n"
                "- Magdala ng valid ID at authorization letter (kung hindi ikaw ang may-ari)\n"
                "- Proseso: 3-5 araw na trabaho\n"
                "- Bayad: ₱150 bawat kopya\n\n"
                "**CENOMAR / PSA** — maaari ding hingin dito.\n\n"
                "Gusto mo pa bang malaman?"
            )
        }
    },

    'real_property_tax': {
        'topics': [
            'rpt', 'real property tax', 'land tax', 'tax declaration', 'amilyar',
            'buwis', 'yuta', 'bayad sa buwis', 'pagbayad buwis'
        ],
        'keywords': [
            'rpt', 'tax', 'land', 'property', 'amilyar', 'buwis'
        ],
        'responses': {
            'en': (
                "**Real Property Tax (Amilyar)**\n\n"
                "- **Full Payment Deadline:** March 31 (with discount)\n"
                "- **Quarterly:** Mar 31, Jun 30, Sep 30, Dec 31\n"
                "- **Bring:** Latest Official Receipt or Tax Declaration\n\n"
                "**Office:** City/Municipal Treasurer's Office\n\n"
                "Any other questions?"
            ),
            'tl': (
                "**Buwis sa Lupa (Amilyar)**\n\n"
                "- **Deadline ng Buong Bayad:** March 31 (may diskwento)\n"
                "- **Quarterly:** Mar 31, Jun 30, Sep 30, Dec 31\n"
                "- **Dalhin:** Pinakahuling Official Receipt o Tax Declaration\n\n"
                "**Opisina:** Tanggapan ng Treasurer\n\n"
                "May tanong ka pa?"
            )
        }
    },

    'health_services': {
        'topics': [
            'health center', 'vaccination', 'medical checkup', 'medicine',
            'kalusugan', 'bakuna', 'gamot', 'doktor'
        ],
        'keywords': [
            'health', 'vaccine', 'medical', 'doctor', 'clinic', 'hospital',
            'kalusugan', 'bakuna', 'gamot', 'doktor', 'ospital'
        ],
        'responses': {
            'en': (
                "**Health Services**\n\n"
                "- **Free Consultation:** Mon-Fri at your Barangay Health Center\n"
                "- **Vaccination:** Schedule posted weekly\n"
                "- **Animal Bite Center:** 24/7 at the City Health Office\n"
                "- **COVID Testing:** Available upon request\n\n"
                "Anything else?"
            ),
            'tl': (
                "**Mga Serbisyong Pangkalusugan**\n\n"
                "- **Libreng Konsultasyon:** Lunes-Biyernes sa Barangay Health Center\n"
                "- **Bakuna:** Naka-schedule linggo-linggo\n"
                "- **Animal Bite Center:** 24/7 sa City Health Office\n"
                "- **COVID Testing:** Available kung kailangan\n\n"
                "May iba pa?"
            )
        }
    },

    'social_services': {
        'topics': [
            'senior citizen', 'pwd', 'solo parent', '4ps', 'financial assistance',
            'nakatatanda', 'may kapansanan', 'tulong', 'ayuda'
        ],
        'keywords': [
            'senior', 'pwd', 'solo', 'assistance', 'dswd', 'ayuda',
            'tulong', 'nakatatanda', 'kapansanan'
        ],
        'responses': {
            'en': (
                "**Social Welfare (CSWD) Services**\n\n"
                "**ID Applications:** (Mon-Fri, 8AM-5PM)\n"
                "- Senior Citizen ID\n"
                "- PWD ID\n"
                "- Solo Parent ID\n\n"
                "**Requirements:** Valid ID, Barangay Certificate, 1x1 photo\n"
                "**Financial Assistance:** Visit DSWD desk for assessment\n\n"
                "Need more help?"
            ),
            'tl': (
                "**Serbisyo ng Social Welfare (CSWD)**\n\n"
                "**Pagkuha ng ID:** (Lunes-Biyernes, 8AM-5PM)\n"
                "- Senior Citizen ID\n"
                "- PWD ID\n"
                "- Solo Parent ID\n\n"
                "**Kailangan:** Valid ID, Barangay Certificate, 1x1 litrato\n"
                "**Tulong Pinansyal:** Pumunta sa DSWD desk para sa assessment\n\n"
                "Kailangan mo pa ba ng tulong?"
            )
        }
    },

    'community_affairs': {
        'topics': [
            'barangay clearance', 'complaint', 'lupon', 'blotter',
            'klaro', 'reklamo', 'sumbong', 'cedula'
        ],
        'keywords': [
            'barangay', 'clearance', 'complaint', 'blotter', 'cedula',
            'klaro', 'reklamo', 'sumbong'
        ],
        'responses': {
            'en': (
                "**Barangay Services**\n\n"
                "Visit your Barangay Hall for:\n"
                "- Barangay Clearance\n"
                "- Community Tax Certificate (Cedula)\n"
                "- Filing of Complaints / Blotter\n"
                "- Certificate of Indigency\n\n"
                "Need directions?"
            ),
            'tl': (
                "**Mga Serbisyo sa Barangay**\n\n"
                "Pumunta sa inyong Barangay Hall para sa:\n"
                "- Barangay Clearance\n"
                "- Community Tax Certificate (Cedula)\n"
                "- Pag-file ng Reklamo / Blotter\n"
                "- Certificate of Indigency\n\n"
                "Kailangan mo ba ng direksyon?"
            )
        }
    },

    'general_info': {
        'topics': [
            'office hours', 'location', 'contact', 'hotline',
            'oras', 'adres', 'numero', 'opisina'
        ],
        'keywords': [
            'hours', 'location', 'contact', 'number', 'address', 'office',
            'oras', 'adres', 'numero', 'opisina'
        ],
        'responses': {
            'en': (
                "**City/Municipal Hall Info**\n\n"
                "- **Hours:** Monday-Friday, 8:00 AM - 5:00 PM\n"
                "- **Hotline:** (02) 8123-4567\n"
                "- **Address:** City Hall Compound, Main St.\n\n"
                "What else can I help with?"
            ),
            'tl': (
                "**Impormasyon sa City/Municipal Hall**\n\n"
                "- **Oras:** Lunes-Biyernes, 8:00 AM - 5:00 PM\n"
                "- **Hotline:** (02) 8123-4567\n"
                "- **Adres:** City Hall Compound, Main St.\n\n"
                "Ano pa ang maitutulong ko?"
            )
        }
    }
}

RESPONSES = {
    'greeting': {
        'en': "Hello! 👋 I'm your **LGU Prime Assistant**. How can I help you today?\n\nYou can ask about Business Permits, Civil Registry, Taxes, Health, or Social Services.",
        'tl': "Magandang araw po! 👋 Ako ang inyong **LGU Prime Assistant**. Paano ko po kayo matutulungan?\n\nMaaari kayong magtanong tungkol sa Business Permit, Civil Registry, Buwis, Kalusugan, o Social Services."
    },
    'thanks': {
        'en': "You're welcome! 😊 Let me know if you need anything else.",
        'tl': "Walang anuman po! 😊 Sabihin lang po kung may kailangan pa kayo."
    },
    'fallback': {
        'en': "I'm sorry, I didn't understand that. Could you rephrase?\n\nYou can ask about: **permits, taxes, certificates, health, or social services**.",
        'tl': "Pasensya na po, hindi ko po naintindihan. Maaari po bang ulitin?\n\nMaaari kayong magtanong tungkol sa: **permits, buwis, sertipiko, kalusugan, o serbisyong panlipunan**."
    }
}
