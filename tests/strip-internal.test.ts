import { test } from "node:test";
import assert from "node:assert/strict";

import { stripInternalNotes, stripPublicDescription, INTERNAL_RE, cleanAltText, publicTextProblem, assertPublicText } from "../lib/etsy/strip-internal";
import { joinSentences, splitSentences } from "../lib/etsy/strip-visualization";

// Real lines from live listings (panel mirror of Etsy, 2026-10-31) -> expected line.
// "" = the line goes.
const LINES: [string, string][] = [
  // EON Christmas collection (English + Spanish), 17 active listings.
  ["An individual, minimalist ring concept with a continuous closed band, designed for delicate stacking. The motif is expressed entirely in metal, without gemstones or enamel.",
   "An individual, minimalist ring with a continuous closed band, designed for delicate stacking. The motif is expressed entirely in metal, without gemstones or enamel."],
  ["• Intended metal: Yellow and white gold", "• Metal: Yellow and white gold"],
  ["Shown as a single ring. Final gold purity, ring sizes, measurements, weight, fit and production details will be confirmed before this design is offered for sale.",
   "Shown as a single ring."],
  ["Un concepto de anillo individual y minimalista con aro cerrado continuo, pensado para combinar en capas delicadas. El motivo se expresa únicamente en metal, sin piedras ni esmalte.",
   "Un anillo individual y minimalista con aro cerrado continuo, pensado para combinar en capas delicadas. El motivo se expresa únicamente en metal, sin piedras ni esmalte."],
  ["• Metal previsto: Oro amarillo y blanco", "• Metal: Oro amarillo y blanco"],
  ["Se muestra un solo anillo. La ley del oro, las tallas, las medidas, el peso, el ajuste y los detalles de producción se confirmarán antes de poner este diseño a la venta.",
   "Se muestra un solo anillo."],
  ["- The integrated motif shows five petals with folds and raised lines, as seen in the design image.",
   "- The integrated motif shows five petals with folds and raised lines, as seen in the listing image."],
  ["- The intended metal is yellow gold; gold karat and ring size are selected from the listing variations.",
   "- The metal is yellow gold; gold karat and ring size are selected from the listing variations."],
  ["- Sizes, final karat, measurements, weight, fit and production details will be confirmed before the design is offered for sale.", ""],
  ["A Christmas-inspired poinsettia ring that also works with everyday stacks. Final specifications will be confirmed before sale.",
   "A Christmas-inspired poinsettia ring that also works with everyday stacks."],
  ["- The listing is for one ring, made to order; final production details are confirmed before the design is offered for sale.",
   "- The listing is for one ring, made to order."],
  ["- The listed materials are yellow and white gold; final gold purity will be confirmed before this design is offered for sale.",
   "- The listed materials are yellow and white gold."],
  ["- Ring size is selected from the available variation options, and final measurements, weight, and fit will be confirmed before the design is offered for sale.",
   "- Ring size is selected from the available variation options."],
  ["- Choose your ring size and gold karat from the available options; final details will be confirmed before the design is offered for sale.",
   "- Choose your ring size and gold karat from the available options."],
  ["This Christmas gold ring is part of the EON Christmas Collection and recalls the evergreen fir. Measurements, weight, fit and production details are not yet specified; they will be confirmed before the design is available.",
   "This Christmas gold ring is part of the EON Christmas Collection and recalls the evergreen fir."],
  // EON Quiet Bevel and weight lines.
  ["• Design target thickness: approximately 1.5 mm", "• Thickness: approximately 1.5 mm"],
  ["- The design target thickness is approximately 1.8 mm, and the width remains fixed at approximately 6.0 mm.",
   "- The thickness is approximately 1.8 mm, and the width remains fixed at approximately 6.0 mm."],
  ["- Weight figures are pre-production estimates based on the design target.", ""],
  ["Gold weight is a pre-production estimate and may vary by approximately 10% after final CAD, casting and finishing.",
   "Gold weight is an estimate and may vary by approximately 10% after casting and finishing."],
  ["- The estimated finished weight at US size 7 is approximately 2.75 g and may vary by about 10% after final CAD, casting, and finishing.",
   "- The estimated finished weight at US size 7 is approximately 2.75 g and may vary by about 10% after casting and finishing."],
  ["- Weight may vary by approximately 10 percent after final CAD, casting and finishing",
   "- Weight may vary by approximately 10 percent after casting and finishing"],
  // Jade Gold NYC.
  ["• Proposed solid 14K or 18K gold construction, never plated or filled", "• Solid 14K or 18K gold construction, never plated or filled"],
  ["• Proposed in solid bright white gold, never plated or filled", "• Solid bright white gold, never plated or filled"],
  ["• Proposed solid 14K yellow, white and rose gold, supplier confirmation pending", "• Solid 14K yellow, white and rose gold"],
  ["• Sold as one pair, exact diameter and closure pending supplier confirmation", "• Sold as one pair"],
  ["• Ready-to-ship stock model with a proposed 3 to 5 business day handling window", "• Ready-to-ship stock model with a 3 to 5 business day handling window"],
  ["Proposed in solid 14K yellow gold with blue topaz and amethyst, it balances sculptural weight with an airy chain for quiet everyday color.",
   "In solid 14K yellow gold with blue topaz and amethyst, it balances sculptural weight with an airy chain for quiet everyday color."],
  ["✔ Length Options: [Insert sizes – 7\", 7.5\", 8\", 8.5\"", "✔ Length Options: 7\", 7.5\", 8\", 8.5\""],
  ["- The final 18K weight is added after production readback, so the finished weight is confirmed after production.", ""],
  ["The 18K gold necklace is prepared from the approved Threshold design.", ""],
  ["This is a provisional Fall 2026 panel proposal built from the approved reference image. Exact gram weight, dimensions, hallmark, closure construction and final supplier cost will be added after production readback. No unverified measurement is presented as final.", ""],
  ["Final wearable minimum and maximum length will be added after supplier readback.", ""],
  ["Gold karat, gemstone identity, treatment, carat weight, hallmark and total weight must be confirmed from the supplier before this panel proposal can be sent to Etsy.", ""],
  ["The supplier quote identifies this bracelet at 7.5 inches and the supplied product image shows an extension chain.", ""],
  ["• 7.5 inch quoted bracelet length", "• 7.5 inch bracelet length"],
  ["Personalization is not enabled in this provisional listing", "Personalization is not enabled"],
  ["Gold weight is a pre-production estimate and may vary by approximately 10% after final CAD, casting and finishing. Final metal weight will be confirmed before the listing is approved for Etsy.",
   "Gold weight is an estimate and may vary by approximately 10% after casting and finishing."],
  // Second sweep (six finders + two judges, 2026-10-31).
  ["- Choose your ring size and gold karat from the available variations; specific measurements and weight are not provided here.",
   "- Choose your ring size and gold karat from the available variations."],
  ["Fine engraving, final dimensions, measured weight and production timing remain subject to physical verification. Hand views illustrate styling. Props are not included.",
   "Hand views illustrate styling. Props are not included."],
  ["ABOUT THIS MODEL PREVIEW", "ABOUT THE IMAGES"],
  ["- Final physical dimensions and weight are not established by the images, and props are not included.", "- Props are not included."],
  ["The main image was created for this metal color. Metal color and reflections vary with lighting and screens. Props are not included.",
   "The main image shows this metal color. Metal color and reflections vary with lighting and screens. Props are not included."],
  ["- Final diamond color, clarity, and certificate availability must be confirmed in writing before production.", ""],
  ["- Production takes 4 to 5 business days after the final stone specification and size are confirmed.",
   "- Production takes 4 to 5 business days after the size is confirmed."],
  ["Choose your faceted gold band options before checkout; the delivery estimate includes the making time.}",
   "Choose your faceted gold band options before checkout; the delivery estimate includes the making time."],
  ["Three softly irregular gold forms meet two vivid oval stones in the C19269 Pebble Station Bracelet.",
   "Three softly irregular gold forms meet two vivid oval stones in the Pebble Station Bracelet."],
  ["• Original reference length 17 cm plus 2 cm extension", ""],
  ["• Original reference length 42 cm", ""],
  ["• No personalization unless explicitly stated", "• No personalization"],
  ["- A stamp is not listed among the provided specifications.", ""],
  ["- A stamp is not specified in the listing details.", ""],
  ["- Stamp details are not specified in the listing information.", ""],
  ["- Stamp: A stamp detail is not specified in the listing.", ""],
  ["- Stamp: Stamp details are not provided in the listing information.", ""],
  ["• Approximate design dimensions: 16.3 mm outer diameter and 9.8 mm width", "• Approximate dimensions: 16.3 mm outer diameter and 9.8 mm width"],
  ["• Forma: anillo cerrado con motivo integrado para fundición", "• Forma: anillo cerrado con motivo fundido integrado"],
  ["Inside engraving is not offered in this draft. The available interior area must be checked before engraving can be promised.",
   "Inside engraving is not offered."],
  ["Este borrador no ofrece grabado interior. Es necesario comprobar el espacio disponible antes de ofrecer este servicio.",
   "No se ofrece grabado interior."],
  ["La galería contiene representaciones asistidas por IA basadas en la fotografía de la muestra física.", ""],
  ["Development: Sample required", ""],
  ["Every price includes one additional gram of casting waste and USD 100 production cost.", ""],
  // The owner's example, without its heading, and the 2027 enamel catalog lines.
  ["Dimensions are development targets. Gold weight, final size options, alloy/enamel compatibility, durability, post/chain joints, price and production time require a physical sample and maker approval. No stock, hallmark, allergy or performance claim is made.", ""],
  ["Internal reference: BAS-27-MINE-R01-14Y", ""],
  ["Protect the enamel from hard impacts and bending. Wipe gently with a soft cloth; avoid abrasive cleaners and ultrasonic cleaning until the maker confirms the care method.",
   "Protect the enamel from hard impacts and bending. Wipe gently with a soft cloth; avoid abrasive cleaners and ultrasonic cleaning."],
  // 2027 enamel catalog: maker instructions go, the measurement stays.
  ["A plain integrated top bail has a proposed clear opening 3.0 x 2.0 mm; verify the actual chain end can pass.",
   "A plain integrated top bail has a clear opening 3.0 x 2.0 mm."],
  ["Integrated bail above the center of mass, with proposed clear opening 3.0 x 2.0 mm; hanging balance must be sampled.",
   "Integrated bail above the center of mass, with clear opening 3.0 x 2.0 mm."],
  ["Nominal 17 cm, proposed 15.5–18 cm adjustment with a short extender and lobster clasp.",
   "Nominal 17 cm, 15.5–18 cm adjustment with a short extender and lobster clasp."],
  ["Proposed 0.8 mm x 10 mm posts and friction butterfly backs; backed faces about 1–1.2 mm.",
   "0.8 mm x 10 mm posts and friction butterfly backs; backed faces about 1–1.2 mm."],
  ["Fire the motif before final chain and clasp assembly.", ""],
  ["Post joint and firing sequence require goldsmith qualification.", ""],
  // Review 2026-10-31: the buyer fact survives other wordings of the same note.
  ["• Sold as one pair, 1.5 mm hoop pending supplier confirmation", "• Sold as one pair"],
  ["- 3 to 5 business day handling; final details will be confirmed before the design is offered for sale.", "- 3 to 5 business day handling."],
  ["• 6 mm wide; supplier cost pending.", "• 6 mm wide."],
  ["- Weights are pre-production estimates, and they may vary by approximately 10% after casting and finishing.",
   "- Weights are estimates, and they may vary by approximately 10% after casting and finishing."],
  // A tail whose subject was in the dropped clause goes with it.
  ["Final weight is confirmed after production readback, and it ships in 3 days.", ""],
  ["• Design target width: approximately 2.1 mm", "• Width: approximately 2.1 mm"],
  ["Weight figures are pre-production estimates and may vary by approximately 10% after final CAD and casting.",
   "Weight figures are estimates and may vary by approximately 10% after casting."],
  ["• Intended metals: Yellow and white gold", "• Metals: Yellow and white gold"],
  ["An individual, minimalist earring concept with a hinged hoop.", "An individual, minimalist earring with a hinged hoop."],
  ["Las especificaciones finales se confirmarán antes de la venta.", ""],
  ["• Grosor objetivo de diseño: aproximadamente 1,5 mm", "• Grosor: aproximadamente 1,5 mm"],
  ["La personalización está prevista, pero el formato debe ser aprobado por el propietario antes de la publicación en Etsy.", ""],
  // Second review 2026-11-01.
  ["- Stamp details are not specified in the listing information. The band is solid 14K gold.", "- The band is solid 14K gold."],
  ["This design is not available for sale yet.", ""],
  ["• Design proposal for Fall 2026; final weight to follow.", "• Final weight to follow."],
  ["Las dimensiones son objetivos de desarrollo.", ""],
  // 2026-11-01: like "Grosor objetivo de diseño", the measurement stays.
  ["El espesor objetivo de diseño es de 1,5 mm.", "El espesor es de 1,5 mm."],
  ["• Design proposal; final weight to follow.", "• Final weight to follow."],
  ["• Design proposal.", ""],
  ["• Design proposal (Fall 2026)", ""],
  ["• Propuesta de diseño.", ""],
  ["Every price includes one additional gram of gold and USD 100 labor.", ""],
  // Spanish translations on Etsy, live 2026-11-01 (2027 enamel copy, EON, Jade).
  ["Referencia interna: BAS-27-MINE-E04-14Y", ""],
  ["Desarrollo: Muestra requerida", ""],
  ["Proteja el esmalte de impactos duros y dobleces. Limpie suavemente con un paño suave; evite limpiadores abrasivos y limpieza ultrasónica hasta que el fabricante confirme el método de cuidado.",
   "Proteja el esmalte de impactos duros y dobleces. Limpie suavemente con un paño suave; evite limpiadores abrasivos y limpieza ultrasónica."],
  ["- Los pesos en gramos mostrados para cada talla son estimaciones preliminares y deben confirmarse antes de la producción.", ""],
  ["Por favor, confirma las medidas finales, el peso y la disponibilidad antes de enviar el anuncio a Etsy; el anillo escultórico terminado se produce después de confirmar esos detalles.", ""],
  ["- Los materiales indicados son oro amarillo y blanco; la pureza final del oro se confirmará antes de que este diseño se ponga a la venta.",
   "- Los materiales indicados son oro amarillo y blanco."],
  ["- La talla del anillo se selecciona entre las opciones de variación disponibles, y las medidas finales, el peso y el ajuste se confirmarán antes de que el diseño se ponga a la venta.",
   "- La talla del anillo se selecciona entre las opciones de variación disponibles."],
  ["- Las dimensiones físicas y el peso finales no se establecen mediante las imágenes, y los accesorios no están incluidos.",
   "- Los accesorios no están incluidos."],
  ["El collar de oro de 18K está preparado a partir del diseño aprobado Threshold.", ""],
  ["Please confirm the final measurements, weight and availability before sending the listing to Etsy.", ""],
  // A glued bullet line: only the internal bullet goes, the others keep their own spacing.
  ["- Cada anillo se hace por encargo.- Desarrollo: muestra requerida.- Limpia con un paño suave.",
   "- Cada anillo se hace por encargo.- Limpia con un paño suave."],
  ["Hecho por encargo.Referencia interna: BAS-27-MINE-R01-14Y. Se envía gratis.",
   "Hecho por encargo. Se envía gratis."],
  // Review 2026-11-01 (second pass): Spanish forms of the English notes, live or literal.
  ["- El peso final de 18K se añade después de la lectura de producción, por lo que el peso terminado se confirma tras la producción.", ""],
  ["- El grosor objetivo del diseño es de aproximadamente 1.8 mm y el ancho permanece fijo en aproximadamente 6.0 mm.",
   "- El grosor es de aproximadamente 1.8 mm y el ancho permanece fijo en aproximadamente 6.0 mm."],
  ["- Elija su talla de anillo y los quilates de oro entre las variaciones disponibles; aquí no se proporcionan medidas específicas ni peso.",
   "- Elija su talla de anillo y los quilates de oro entre las variaciones disponibles."],
  ["• Se vende como un par; el diámetro exacto y el cierre están pendientes de confirmación del proveedor.", "• Se vende como un par."],
  ["- Los detalles del sello no se especifican en la información del anuncio.", ""],
  ["Se requiere la aprobación del CAD final y del peso de fundición antes de cualquier acción de precio en Etsy.", ""],
  ["Estos pendientes de oro esculturales se proponen como un par simétrico en espejo.",
   "Estos pendientes de oro esculturales son un par simétrico en espejo."],
  ["These sculptural gold earrings are proposed as a mirror-symmetric pair.",
   "These sculptural gold earrings are a mirror-symmetric pair."],
  // One bullet, not two, when the first sentence of a glued bullet line goes.
  ["- Desarrollo: muestra requerida.- Cada anillo se hace por encargo.", "- Cada anillo se hace por encargo."],
  ["• Referencia interna: BAS-27-MINE-R01-14Y.• Se envía gratis.", "• Se envía gratis."],
  // An abbreviation is not a sentence end: the whole internal sentence goes, not its tail.
  ["- Los pesos en gramos para las tallas de EE. UU. 3 a la 16 son estimaciones preliminares y deben confirmarse antes de la producción.", ""],
  ["The finished weight (approx. 2.4 g) must be confirmed before production.", ""],
  ["- Gram weights for U.S. Sizes 3 to 16 are estimates and must be confirmed before production.", ""],
  // Review 2026-11-01 (third pass).
  ["Model shown wears size U.S. 7. Final weight must be confirmed before production.", "Model shown wears size U.S. 7."],
  ["Weight 2.4 g approx. Final weight must be confirmed before production.", "Weight 2.4 g approx."],
  ["- El ancho objetivo del diseño es de aproximadamente 6.0 mm.", "- El ancho es de aproximadamente 6.0 mm."],
  ["- El grosor objetivo del diseño es de aproximadamente 1.8 mm y el ancho objetivo del diseño permanece fijo en aproximadamente 6.0 mm.",
   "- El grosor es de aproximadamente 1.8 mm y el ancho permanece fijo en aproximadamente 6.0 mm."],
  ["- Weights for U.S. sizes 3 to 16 must be confirmed before production.", ""],
  ["- Weight figures (e.g. 2.4 g at US 7) must be confirmed before production.", ""],
  ["- Weights for the 16 in. and 18 in. chains must be confirmed before production.", ""],
  ["Please confirm the final measurements, weight and availability before sending the listing to Etsy, and the finished sculptural ring is produced after those details are confirmed.", ""],
  // The details are the buyer's own (size and text named in the same clause): the clause stays whole.
  ["Final CAD is pending owner approval; send us your ring size and engraving text, and your ring ships within 10 business days after these details are confirmed.",
   "Send us your ring size and engraving text, and your ring ships within 10 business days after these details are confirmed."],
  ["La personalización está prevista; envíanos tu talla y el texto, y el anillo se envía en 10 días después de confirmar estos detalles.",
   "Envíanos tu talla y el texto, y el anillo se envía en 10 días después de confirmar estos detalles."],
  // Convergence check 2026-11-01: every confirmed example of three review rounds re-run at HEAD.
  ["La coma representa una historia que continúa, mientras que las dimensiones de desarrollo siguen estando sujetas a muestreo físico y aprobación del fabricante.",
   "La coma representa una historia que continúa."],
  ["The comma represents a continuing story, while development dimensions remain subject to physical sampling and maker approval.",
   "The comma represents a continuing story."],
  ["El cierre es de langosta, pendiente de confirmación del proveedor para la talla 8.", "El cierre es de langosta."],
  ["Peso aproximado de 3,2 g, pendiente de confirmación del proveedor tras la fundición.", "Peso aproximado de 3,2 g."],
  ["• Disponible en tallas 5 a 9 de EE. UU., diámetro exacto pendiente de confirmación del proveedor.", "• Disponible en tallas 5 a 9 de EE. UU."],
  ["The finished weight (approx. 3mm band, US 7) must be confirmed before production.", ""],
  ["La cotización del proveedor identifica esta pulsera en 7,5 pulgadas. La longitud mínima y máxima final se añadirá después de la lectura del proveedor.", ""],
  ["El precio final depende del costo del proveedor.", ""],
  ["• Se vende como par, diámetro de 12,5 mm y cierre pendientes de confirmación del proveedor.", "• Se vende como par."],
  // Review 2026-11-01 (fourth pass).
  ["The finished weight (approx. 2g) must be confirmed before production.", ""],
  ["- Weights (approx. Size 7) must be confirmed before production.", ""],
  ["Los pesos (aprox. EE. UU. 7) deben confirmarse antes de la producción.", ""],
  ["Solid 14K gold band. The finished weight (approx. 2g) must be confirmed before production. Free shipping.", "Solid 14K gold band. Free shipping."],
  ["Weights for 10K vs. 14K are estimates and must be confirmed before production.", ""],
  ["- El peso en gramos mostrado es una estimación preliminar y debe confirmarse antes de la producción.", ""],
  ["- Los pesos mostrados son estimaciones, y deben confirmarse antes de la producción.", "- Los pesos mostrados son estimaciones."],
  ["• Disponible en tallas de EE. UU. 5 a 9, diámetro exacto pendiente de confirmación del proveedor.", "• Disponible en tallas de EE. UU. 5 a 9."],
  ["• Oro macizo de 14K amarillo, blanco y rosa, confirmación del proveedor pendiente", "• Oro macizo de 14K amarillo, blanco y rosa"],
  ["La cotización del proveedor identifica esta pulsera en 7,5 pulgadas y la imagen de producto suministrada muestra una cadena de extensión.", ""],
  ["These sculptural gold earrings are proposed as a symmetrical mirror pair with rounded upper lobes.",
   "These sculptural gold earrings are a symmetrical mirror pair with rounded upper lobes."],
  ["Este par se propone como una pareja en espejo.", "Este par es una pareja en espejo."],
  ["Todos los precios incluyen un gramo adicional de desperdicio de fundición.", ""],
  ["Se requiere la aprobación final del CAD y del peso de fundición.", ""],
  ["El CAD final y el peso de fundición deben aprobarse antes de la venta.", ""],
  ["- Elija su talla de anillo y los quilates de oro entre las variaciones disponibles; aquí no se proporcionan las medidas específicas ni el peso.",
   "- Elija su talla de anillo y los quilates de oro entre las variaciones disponibles."],
];

// Ordinary buyer copy from the same listings: must come back byte for byte.
const KEEP: string[] = [
  "Each listing is for one ring in the karat and gold color named in the title. Width and ring size are selected within this listing.",
  "Your ring is made to order after the ring size is confirmed. The delivery date shown at checkout includes the making time.",
  "- The estimated finished weight is approximately 2.10 g at US size 7 and may vary by approximately 10% after final production.",
  "- The slender profile is intended for delicate stacking, or wear it on its own as a sculptural gold band ring.",
  "Engagements and proposals",
  "Bridesmaid proposals",
  "Design meaning is a personal interpretation, not a protective or healing promise.",
  "• Listing images show the 6 mm reference width unless otherwise noted",
  "The photo shows the yellow gold version with a brushed face and polished edges.",
  "──────── ESPAÑOL ────────",
  "Order before the sale ends and save.",
  "Colors and appearance may vary slightly depending on lighting, photography, and individual screen settings.",
  // Review 2026-10-31: buyer sentences that share a word with an internal note.
  "Ring size must be checked before ordering; wide bands fit tighter.",
  "Es necesario comprobar la talla antes de realizar el pedido.",
  "After purchase we send the final CAD for your approval before casting.",
  "Once the approved design is confirmed, your ring is handmade in 2 to 3 weeks.",
  "Custom engraving is made exactly to your provided specifications.",
  "If your ring size is not listed in the listing, message us for a custom order.",
  "We send you a design proposal within 48 hours of your order.",
  "Our maker confirms every stone setting under magnification.",
  "Lab grown diamonds are sourced from the supplier with an IGI certificate.",
  "La muestra fotografiada es de oro amarillo de 14K.",
  "All stones are natural unless explicitly stated otherwise.",
  "Send us your design image after checkout and we will engrave it.",
  "Use the size chart to visualize the band width on your finger.",
  "Engraved initials such as AI, JM or LK are available.",
  "Each engraving is a crisp rendering of your own handwriting.",
  // EON, live: a buyer claim that the photos are real.
  "The photos and videos in this listing are our real bands, not renders.",
  "No AI photos here: the gallery shows the real ring.",
  // Second review 2026-11-01.
  "All photos are of the actual piece, not renderings. Ships in 3 days.",
  "Pictures are taken in natural light, without filters or renders.",
  "Every photo is a real photograph of your ring, never 3D renders; colors may vary by screen.",
  "Your photo renders beautifully on the polished 14K pendant.",
  "Send us a photo of the handwriting and we create a crisp rendering of it in solid gold.",
  "Send us a photo, or choose initials such as AI, JM or LK.",
  "We share the final CAD with you before casting.",
  "We send you a design proposal within 48 hours; once you approve the design proposal, your ring is cast.",
  "Please verify the actual ring size with a local jeweler before ordering.",
  "The display box shown is not available for sale.",
  "Props shown are for styling and are not available for sale.",
  "Te enviamos una propuesta de diseño en 48 horas tras tu pedido.",
  "Nuestro objetivo de diseño fue crear un anillo cómodo para el uso diario.",
  "If your size is not specified in the listing, message us before ordering.",
  // Third review 2026-11-01.
  "Need a size not specified in the listing? Message us before ordering.",
  "Before casting, your custom design is shown as a CAD rendering for your approval.",
  "Your engraving is shown as a digital rendering on the proof we email you.",
  "HOW IT WORKS\n1. Place your order\n2. Design proposal: we email a sketch within 48 hours\n3. Casting and finishing",
  "• Design proposal sent within 48 hours of your order",
  "The Heavy option adds an additional gram of gold for a more substantial feel.",
  "Our photos are not made with AI: every picture shows the real ring.",
  "Nuestras fotos no se crearon con IA.",
  // Final review 2026-11-01.
  "Las fotos son reales, ninguna está editada con IA.",
  "Our photos are real, none of them edited with AI.",
  "Photos: real ring, real light, nothing made with AI.",
  "• Design proposal (included with every custom order)",
  // Closing check 2026-11-01: a governing negation at any distance in the clause.
  "Our photos are not made using any kind of AI.",
  "These photos were never edited by any kind of AI tool.",
  "Nuestras fotos no se han editado en absoluto con IA.",
  "PRICE NOTE\nPrice is for one earring, not a pair. Buy two for a pair.",
  "PRODUCTION NOTES\nEach piece is cast in recycled gold and hand-finished; allow 2 to 3 weeks.",
  // Spanish buyer copy from the same translations (2026-11-01).
  "- Elige una talla de anillo de EE. UU. de la 3 a la 16, incluyendo tallas enteras y medias.",
  "Elige oro amarillo, blanco o rosa de 10K, 14K o 18K, y selecciona un pendiente o un par.- Cada pieza se hace a pedido y normalmente se procesa en 3 a 5 días.",
  "La pulsera de cadena de oro no tiene piedras, y la imagen muestra la pulsera en color oro amarillo.",
  "Colección: Artifact Studio 2027 Color and Enamel.",
  "Metal: Oro amarillo de 14K",
  "Confirma tu talla antes de realizar el pedido; el anillo se fabrica después de confirmar la talla.",
  "Envíanos tu diseño y, a partir del diseño que apruebes, fabricamos tu anillo.",
  "Please confirm your ring size before ordering.",
  "Los accesorios no están incluidos.",
  // Review 2026-11-01 (second pass): custom-order copy that shares words with the new notes.
  "La pieza no se graba hasta que el fabricante confirme tu texto; te enviamos la prueba por mensaje.",
  "Los pedidos no se envían hasta que el fabricante confirme la talla final del anillo.",
  "We do not engrave until the maker confirms your text.",
  "Engraving text and ring size must be confirmed before production begins; we email you a proof within 24 hours.",
  "Your ring size must be confirmed before production, so please use our free ring sizer.",
  "La talla del anillo y el texto del grabado deben confirmarse antes de la producción; te enviamos una prueba en 24 horas.",
  "Solid 14K gold signet ring.\n\nPERSONALIZATION\nEngraving text and font must be confirmed before production.\n\nSHIPPING\nShips in 2 to 3 weeks.",
  "Your order ships within 2 to 3 weeks after those details are confirmed.",
  "We send you a digital proof of your engraving, and production begins after these details are confirmed.",
  "Te enviamos una prueba digital del grabado y comenzamos la fabricación después de confirmar estos detalles.",
  "Solid 14K gold signet ring.\n\nPRODUCTION NOTES\nProduction begins after these details are confirmed.\nEach piece is cast in recycled gold.",
  "Una vez que apruebes el boceto, fabricamos tu anillo a partir del diseño aprobado.",
  "Cada pieza personalizada se funde en oro macizo a partir del diseño aprobado por ti.",
  "We cast your ring from the approved sketch.",
  "La foto que nos envíes será la referencia aprobada para el grabado.",
  "Comparamos cada pieza terminada con la referencia aprobada antes de enviarla.",
  "Iniciales AI y las fotos del anuncio muestran la pieza real.",
  "Puedes grabar iniciales como AI y las fotos muestran ejemplos de tipografía.",
  "Únete a la lista de espera y te avisamos antes de que el modelo se ponga a la venta.",
  // Review 2026-11-01 (third pass).
  "- Pago en cuotas con Klarna disponible al finalizar la compra, sujeto a aprobación del proveedor.",
  "El número de seguimiento se envía por correo tras la confirmación del proveedor de envío.",
  "- Envíos internacionales: el precio final del envío depende de la cotización del proveedor de mensajería.",
  "Entrega estimada de 3 a 5 días hábiles, pendiente de confirmación del proveedor de envío.",
  "Cada anillo se fabrica a pedido en la talla y el peso que elijas, y el texto del grabado debe confirmarse antes de la producción.",
  "- Peso de fundición: 4,1 g (aprox.), oro macizo de 14K.",
  "- Las cadenas que se muestran aquí no se proporcionan; el colgante se vende solo.",
  "Con la comodidad diaria como objetivo del diseño, el interior del anillo es redondeado para un ajuste cómodo.",
  "La ligereza y la comodidad son objetivos del diseño: el anillo pesa solo 2 g.",
  "Nuestro taller se propone como objetivo crear joyas que duren generaciones.",
  "Este anillo se propone como alternativa moderna al solitario clásico.",
  "Each custom design is proposed as a hand sketch first, then refined in CAD with you.",
  "This set is proposed as a gift for the bride.",
  "Reciclamos todo el desperdicio de fundición en nuevas piezas, así que nada se pierde.",
  // Review 2026-11-01 (fourth pass): buyer steps next to a weight or estimate word.
  "Each name necklace is about 3 grams and the name spelling must be confirmed before production.",
  "Pendant weighs approximately 1.8 grams, and engraving text must be confirmed before production.",
  "Shipping estimates apply to the U.S. only, and engraving text must be confirmed before production.",
  "Delivery estimates are for the U.S. and personalized engraving must be confirmed before production.",
  "Weights shown are for the 18 in. chain, and engraving text must be confirmed before production.",
  "La estimación de entrega aparece al pagar y el texto del grabado debe confirmarse antes de la producción.",
  "Envío gratis a EE. UU., pendiente de confirmación del proveedor logístico.",
  "We recycle all casting waste into new pieces, so nothing is lost.",
];

// Image disclosures whose line also holds buyer facts (review 2026-11-01, second pass).
const VIS_LINES: [string, string][] = [
  ["- Las imágenes del producto son visualizaciones de diseño.- Se puede añadir un mensaje de regalo al finalizar la compra.",
   "- Se puede añadir un mensaje de regalo al finalizar la compra."],
  ["1. Las imágenes del producto son visualizaciones de diseño.- Se puede añadir un mensaje de regalo al finalizar la compra.",
   "1. Se puede añadir un mensaje de regalo al finalizar la compra."],
  ["The photos are AI visualizations of the U.S. Size 7 ring. Ships free.", "Ships free."],
  ["Free shipping in the U.S. The images are design visualizations.", "Free shipping in the U.S."],
  ["“Hecho a mano en Nueva York.” Las imágenes son visualizaciones de diseño.", "“Hecho a mano en Nueva York.”"],
  ["Hecho a pedido… Las imágenes son visualizaciones de diseño.", "Hecho a pedido…"],
  ["1. Cada anillo se hace por encargo. 2. Las imágenes son visualizaciones de diseño. 3. Se envía gratis.",
   "1. Cada anillo se hace por encargo. 3. Se envía gratis."],
  ["Ships free in 3 to 5 days. The images are design visualizations. by Artifact Studio Jewelry pieces are cast in New York.",
   "Ships free in 3 to 5 days. by Artifact Studio Jewelry pieces are cast in New York."],
  ["- Elige una talla de EE. UU. del 3 al 16.Las imágenes del producto son visualizaciones de diseño.", "- Elige una talla de EE. UU. del 3 al 16."],
  ["- Elige oro macizo de 10K, 14K o 18K.Las imágenes del producto son visualizaciones de diseño.", "- Elige oro macizo de 10K, 14K o 18K."],
  ["- Incluye una cadena de 1,2 mm (45 cm).Las imágenes del producto son visualizaciones de diseño.", "- Incluye una cadena de 1,2 mm (45 cm)."],
  // Review 2026-11-01 (third pass): a size after an abbreviation, an abbreviation at a sentence
  // end, an unlisted abbreviation before lowercase, a marker that is content.
  ["El anillo de las fotos es una talla de EE. UU. 7. Las imágenes del producto son visualizaciones de diseño.",
   "El anillo de las fotos es una talla de EE. UU. 7."],
  ["The ring in the photos is a size U.S. 7. The images are design visualizations.", "The ring in the photos is a size U.S. 7."],
  ["Style No. 12. The images are design visualizations.", "Style No. 12."],
  ["- Seleccione la talla de EE. UU. 7.- Las imágenes son visualizaciones creadas con IA.", "- Seleccione la talla de EE. UU. 7."],
  ["Pendant measures 12 mm approx. The listing images are AI-generated renderings.", "Pendant measures 12 mm approx."],
  ["El colgante mide 12 mm aprox. Las imágenes son visualizaciones creadas con IA.", "El colgante mide 12 mm aprox."],
  ["Ships free within the U.S. 3D visualizations are shown in place of photos.", "Ships free within the U.S."],
  ["The images are AI renders of the 0.10 ct. diamond band; sizes 5 to 9.", "Sizes 5 to 9."],
  ["- ✔ Envío gratis. Las imágenes son visualizaciones creadas con IA.", "- ✔ Envío gratis."],
  ["Las fotos del anuncio… fueron editadas con IA.", ""],
  ["Product photos, incl. the hand shot, are AI-assisted.", ""],
  // Review 2026-11-01 (fourth pass): a sentence that starts lowercase; abbreviations that never end one.
  ["Handmade to order. The listing images are design visualizations. iPhone photos of your finished ring are sent before shipping.",
   "Handmade to order. iPhone photos of your finished ring are sent before shipping."],
  ["handmade to order in solid 14k gold. ships in 3 to 5 business days. the images are design visualizations.",
   "handmade to order in solid 14k gold. ships in 3 to 5 business days."],
  ["Product images, e.g. The Hero shot, are AI-assisted.", ""],
  ["The images are AI visualizations comparing 14K vs. 18K gold.", ""],
  // Convergence check 2026-11-01.
  ["Envío gratis dentro de EE. UU. 3 de las imágenes son visualizaciones.", "Envío gratis dentro de EE. UU."],
  ["Free shipping in the U.S. 2 of the photos are AI visualizations.", "Free shipping in the U.S."],
  ["Grosor mín. de 1,5 mm; las imágenes son visualizaciones creadas con IA.", "Grosor mín. de 1,5 mm."],
  ["Puedes grabar iniciales, p. ej. tus nombres; las fotos son visualizaciones.", "Puedes grabar iniciales, p. ej. tus nombres."],
  ["Engraved with “Forever.” on the inside; the photos are AI renders.", "Engraved with “Forever.” on the inside."],
  ["Las imágenes del producto, p. ej. la de tres metales, son visualizaciones de diseño. Se envía gratis.", "Se envía gratis."],
  ["Las fotos, p. ej. la del modelo, son generadas con IA.", ""],
  ["Sizes: 3. 4. 5. 6. 7. 8. 9. 10. The images are AI visualizations.", "Sizes: 3. 4. 5. 6. 7. 8. 9. 10."],
];

test("a long line of bare list numbers is split in linear time", () => {
  const line = "1. ".repeat(1700) + "The images are AI visualizations.";
  const t0 = Date.now();
  publicTextProblem(line);
  assert.ok(Date.now() - t0 < 1500, `took ${Date.now() - t0} ms`);
});

test("image disclosures in a line with buyer facts take only their own sentence", () => {
  for (const [input, expected] of VIS_LINES) {
    assert.equal(stripPublicDescription(input).text, expected, input);
  }
});

test("Spanish internal sections go by name", () => {
  const before =
    "Una pulsera de oro.\n\nNOTA IMPORTANTE DE PRODUCCIÓN\nEl peso final exacto, el contraste y el costo del proveedor están pendientes de la lectura de producción.\n\n" +
    "NOTA DE PESO Y PRECIO\nCada precio incluye un gramo adicional de desperdicio de fundición y 100 USD de costo de producción.";
  assert.equal(stripPublicDescription(before).text, "Una pulsera de oro.");
});

// Spanish translations on Etsy (live 2026-11-01) -> expected line, both rules together.
// The 2026-11-01 first pass took the bullets before a disclosure in a glued line with it.
const ES_LINES: [string, string][] = [
  // 4585879436 bow pendant: glued bullets, the gift-message and enamel-care bullets stay
  ["Un collar con colgante de lazo combina esmalte vítreo azul marino oceánico con contornos de oro pulido para crear un detalle en forma de cinta que se asienta recto sobre la clavícula. El lazo plano tiene centros de bucle calados y una pequeña argolla que surge detrás del nudo, como se muestra en la imagen del producto.- El colgante es de oro macizo a elegir entre 10K, 14K o 18K, con opciones de oro amarillo, blanco o rosa.- El esmalte vítreo azul marino cocido en horno se asienta al ras en cavidades empotradas, bordeado por bordes de oro pulido.- El lazo mide 12 x 9 mm, lo que otorga a este colgante de lazo de oro un perfil compacto para el uso diario o para combinar en capas.- Se incluye una cadena de eslabones de oro macizo de 1.2 mm con cierre de resorte.- Elija una longitud de cadena de 16, 18 o 20 pulgadas para adaptarla a su escote y capas preferidas.- Cada pieza se fabrica bajo pedido y tiene un tiempo de procesamiento de 3 a 5 días; se puede añadir un mensaje de regalo al finalizar la compra.- El esmalte es vidrio fusionado al oro y puede astillarse con un golpe fuerte, así que quítese el collar para ir al gimnasio y lavar los platos, y límpielo con un paño suave.- Las imágenes del producto son visualizaciones de diseño y la pieza terminada puede variar ligeramente; la imagen de los tres metales muestra las opciones de oro amarillo, blanco y rosa.Este collar de lazo y cinta está disponible en las variaciones de quilates, color y longitud de cadena indicadas.",
   "Un collar con colgante de lazo combina esmalte vítreo azul marino oceánico con contornos de oro pulido para crear un detalle en forma de cinta que se asienta recto sobre la clavícula. El lazo plano tiene centros de bucle calados y una pequeña argolla que surge detrás del nudo, como se muestra en la imagen del producto.- El colgante es de oro macizo a elegir entre 10K, 14K o 18K, con opciones de oro amarillo, blanco o rosa.- El esmalte vítreo azul marino cocido en horno se asienta al ras en cavidades empotradas, bordeado por bordes de oro pulido.- El lazo mide 12 x 9 mm, lo que otorga a este colgante de lazo de oro un perfil compacto para el uso diario o para combinar en capas.- Se incluye una cadena de eslabones de oro macizo de 1.2 mm con cierre de resorte.- Elija una longitud de cadena de 16, 18 o 20 pulgadas para adaptarla a su escote y capas preferidas.- Cada pieza se fabrica bajo pedido y tiene un tiempo de procesamiento de 3 a 5 días; se puede añadir un mensaje de regalo al finalizar la compra.- El esmalte es vidrio fusionado al oro y puede astillarse con un golpe fuerte, así que quítese el collar para ir al gimnasio y lavar los platos, y límpielo con un paño suave.- La imagen de los tres metales muestra las opciones de oro amarillo, blanco y rosa.Este collar de lazo y cinta está disponible en las variaciones de quilates, color y longitud de cadena indicadas."],
  // 4590702638 bar stud: "cepillado.Las imágenes" glued with no space
  ["Un pendiente de barra de oro macizo tiene un perfil delgado de 2 x 8 mm, con una cara cepillada y bordes pulidos. Su línea vertical sigue el lóbulo de la oreja, ofreciendo una alternativa limpia a un pendiente redondo. Elige oro amarillo, blanco o rosa de 10K, 14K o 18K, y selecciona un pendiente o un par.- Cada pequeño pendiente de barra de oro mide 2 x 8 mm y tiene una forma de barra corta.- La cara es cepillada, mientras que los bordes están pulidos para lograr un contraste en el acabado.- Los postes y cierres de mariposa de oro macizo aseguran cada pendiente de barra minimalista.- Elige un solo pendiente o un par usando la opción de piezas.- Selecciona el quilate y el color de metal que se adapten a tu preferencia; no incluye piedras.- Cada pieza se hace a pedido y normalmente se procesa en 3 a 5 días.- Limpia con un paño suave para su cuidado; un joyero puede renovar el acabado cepillado.Las imágenes del producto son visualizaciones de diseño, y la imagen de los tres metales muestra el mismo diseño en oro amarillo, blanco y rosa. La pieza terminada puede variar ligeramente. Tu pendiente de barra de oro se envía gratis dentro de los Estados Unidos desde Nueva Jersey; se pueden agregar mensajes de regalo al finalizar la compra.",
   "Un pendiente de barra de oro macizo tiene un perfil delgado de 2 x 8 mm, con una cara cepillada y bordes pulidos. Su línea vertical sigue el lóbulo de la oreja, ofreciendo una alternativa limpia a un pendiente redondo. Elige oro amarillo, blanco o rosa de 10K, 14K o 18K, y selecciona un pendiente o un par.- Cada pequeño pendiente de barra de oro mide 2 x 8 mm y tiene una forma de barra corta.- La cara es cepillada, mientras que los bordes están pulidos para lograr un contraste en el acabado.- Los postes y cierres de mariposa de oro macizo aseguran cada pendiente de barra minimalista.- Elige un solo pendiente o un par usando la opción de piezas.- Selecciona el quilate y el color de metal que se adapten a tu preferencia; no incluye piedras.- Cada pieza se hace a pedido y normalmente se procesa en 3 a 5 días.- Limpia con un paño suave para su cuidado; un joyero puede renovar el acabado cepillado. La pieza terminada puede variar ligeramente. Tu pendiente de barra de oro se envía gratis dentro de los Estados Unidos desde Nueva Jersey; se pueden agregar mensajes de regalo al finalizar la compra."],
  // 4591200606 knife edge: "EE. UU. de la 3" is not a sentence start
  ["Un anillo knife edge de oro macizo pulido tiene un perfil esbelto de 2,5 mm y una cresta central elevada que capta la luz. Elige oro de 10k, 14k o 18k en amarillo, blanco o rosa, con tallas de anillo de EE. UU. de la 3 a la 16 disponibles en tallas enteras y medias. Es un anillo moderno para hombre con un perfil limpio para usar solo o junto con otra joyería.- La alianza mide 2,5 mm de ancho, con dos planos exteriores que se encuentran en una cresta distintiva para dar un aspecto facetado.- Selecciona oro macizo de 10k, 14k o 18k y elige el color de metal amarillo, blanco o rosa.- El acabado pulido no tiene piedras, y el anillo es de oro macizo en su totalidad.- Elige una talla de anillo de EE. UU. de la 3 a la 16, incluyendo tallas enteras y medias.- Cada anillo se hace por encargo, con un plazo de procesamiento indicado de 3 a 5 días.- Un paño suave es adecuado para limpiar el oro; la descripción señala que el oro macizo no se deslustra.- El diseño de la imagen es una visualización; la imagen de los tres metales muestra el mismo diseño en oro amarillo, blanco y rosa, y la pieza terminada puede variar levemente.La esbelta alianza de oro también funciona como alianza de boda para hombre. El anillo knife edge seleccionado se fabrica en el quilataje, color y talla elegidos.",
   "Un anillo knife edge de oro macizo pulido tiene un perfil esbelto de 2,5 mm y una cresta central elevada que capta la luz. Elige oro de 10k, 14k o 18k en amarillo, blanco o rosa, con tallas de anillo de EE. UU. de la 3 a la 16 disponibles en tallas enteras y medias. Es un anillo moderno para hombre con un perfil limpio para usar solo o junto con otra joyería.- La alianza mide 2,5 mm de ancho, con dos planos exteriores que se encuentran en una cresta distintiva para dar un aspecto facetado.- Selecciona oro macizo de 10k, 14k o 18k y elige el color de metal amarillo, blanco o rosa.- El acabado pulido no tiene piedras, y el anillo es de oro macizo en su totalidad.- Elige una talla de anillo de EE. UU. de la 3 a la 16, incluyendo tallas enteras y medias.- Cada anillo se hace por encargo, con un plazo de procesamiento indicado de 3 a 5 días.- Un paño suave es adecuado para limpiar el oro; la descripción señala que el oro macizo no se deslustra.- La imagen de los tres metales muestra el mismo diseño en oro amarillo, blanco y rosa, y la pieza terminada puede variar levemente.La esbelta alianza de oro también funciona como alianza de boda para hombre. El anillo knife edge seleccionado se fabrica en el quilataje, color y talla elegidos."],
  // 4591189111 figaro: "no tiene piedras y las fotos ..."
  ["- La pulsera no tiene piedras y las fotos del anuncio son visualizaciones de diseño de la pieza terminada.",
   "- La pulsera no tiene piedras."],
  // 4593723030 EON: image clause and the for-sale note
  ["- El anuncio es para un anillo, hecho por encargo, y la imagen es una visualización del diseño; los detalles de producción finales se confirman antes de que el diseño se ponga a la venta.",
   "- El anuncio es para un anillo, hecho por encargo."],
  // 4562312911 Jade Threshold
  ["- El collar se hace por encargo con 1-3 días de procesamiento, y las imágenes con estilo son visualizaciones de producción en lugar de una galería de productos finales.",
   "- El collar se hace por encargo con 1-3 días de procesamiento."],
];

test("each real internal line is cut to its buyer fact", () => {
  for (const [input, expected] of LINES) {
    assert.equal(stripInternalNotes(input).text, expected, input);
    assert.equal(stripPublicDescription(input).text, expected, input);
  }
});

test("Spanish translations: a disclosure at the end of a glued line takes only its own sentence", () => {
  for (const [input, expected] of ES_LINES) {
    const r = stripPublicDescription(input);
    assert.equal(r.text, expected, input.slice(0, 80));
    assert.equal(publicTextProblem(r.text), null, input.slice(0, 80));
  }
});

test("sentences split and join back byte for byte; a dropped one leaves one gap", () => {
  for (const t of [
    "A. B. C.",
    "tallas de EE. UU. de la 3 a la 16. Las imágenes ...",
    "medias.- Cada anillo.- Un paño suave.Las imágenes son X. Fin.",
    "One  two. Three.  Four!",
    "Sin punto final",
  ]) {
    const { parts, seps } = splitSentences(t);
    assert.equal(joinSentences(parts, seps), t, t);
  }
  assert.deepEqual(splitSentences("de EE. UU. de la 3. Fin.").parts, ["de EE. UU. de la 3.", "Fin."]);
  // Glued only after a lowercase letter: "EE.UU." and "A.B." are not sentence ends.
  assert.deepEqual(splitSentences("EE.UU. y A.B.").parts, ["EE.UU. y A.B."]);
  const glued = splitSentences("Uno.Dos. Tres.");
  assert.deepEqual(glued.parts, ["Uno.", "Dos.", "Tres."]);
  assert.equal(joinSentences(["Uno.", null, "Tres."], glued.seps), "Uno. Tres.");
  const spaced = splitSentences("Uno. Dos.Tres.");
  assert.equal(joinSentences(["Uno.", null, "Tres."], spaced.seps), "Uno. Tres.");
  assert.equal(joinSentences([null, "Dos.", "Tres."], spaced.seps), "Dos.Tres.");
});

test("a line whose signal changes no sentence comes back byte for byte", () => {
  // Two spaces between sentences: the old rebuild joined every sentence with one space.
  const line = "Hecho por encargo.  Se envía gratis.";
  assert.equal(stripPublicDescription(line).text, line);
});

test("ordinary buyer copy is untouched, byte for byte, and passes the guard", () => {
  for (const line of KEEP) {
    for (const r of [stripInternalNotes(line), stripPublicDescription(line)]) {
      assert.equal(r.text, line);
      assert.equal(r.edits.length, 0, line);
    }
    assert.equal(publicTextProblem(line), null, line);
  }
});

test("the owner's example goes as one section", () => {
  const before = [
    "Blue Notch — a small accent of cobalt blue.",
    "",
    "CARE",
    "Protect the enamel from hard impacts and bending.",
    "",
    "DESIGN PROPOSAL — NOT READY FOR SALE",
    "The single image is an AI-generated design visualization, not a photograph of a finished product. Dimensions are development targets. Gold weight, final size options, alloy/enamel compatibility, durability, post/chain joints, price and production time require a physical sample and maker approval. No stock, hallmark, allergy or performance claim is made.",
    "",
    "Internal reference: BAS-27-MINE-R01-14Y",
    "Collection: Artifact Studio 2027 Color and Enamel.",
  ].join("\n");
  const r = stripPublicDescription(before);
  assert.equal(
    r.text,
    [
      "Blue Notch — a small accent of cobalt blue.",
      "",
      "CARE",
      "Protect the enamel from hard impacts and bending.",
      "",
      "Collection: Artifact Studio 2027 Color and Enamel.",
    ].join("\n"),
  );
  assert.ok(!INTERNAL_RE.test(r.text));
});

test("Jade production note section and an emptied personalization section both go", () => {
  const before = [
    "DETAILS",
    "• Fine cable chain",
    "• Proposed solid 14K or 18K gold construction, never plated or filled",
    "• Made to order",
    "",
    "VARIATIONS",
    "Choose 14K or 18K solid yellow, white or rose gold, then select chain size.",
    "",
    "PERSONALIZATION",
    "Personalization is planned, but the submission format and production readback must be owner-approved before Etsy publication.",
    "",
    "IMPORTANT PRODUCTION NOTE",
    "Exact finished weight, hallmark, closure mechanics and supplier cost are pending production readback. All karat-specific panel prices are provisional and cannot be published to Etsy until owner approval.",
    "",
    "Jade Gold NYC, designed in New York City.",
  ].join("\n");
  assert.equal(
    stripInternalNotes(before).text,
    [
      "DETAILS",
      "• Fine cable chain",
      "• Solid 14K or 18K gold construction, never plated or filled",
      "• Made to order",
      "",
      "VARIATIONS",
      "Choose 14K or 18K solid yellow, white or rose gold, then select chain size.",
      "",
      "Jade Gold NYC, designed in New York City.",
    ].join("\n"),
  );
});

test("EON weight and price note section goes, the details bullets stay", () => {
  const before = [
    "DETAILS",
    "• Design target thickness: approximately 1.5 mm",
    "• No engraving or text personalization",
    "",
    "MADE TO ORDER",
    "Your ring is made to order after the ring size is confirmed.",
    "",
    "WEIGHT AND PRICE NOTE",
    "Weights are pre-production estimates based on the design target. Every price includes one additional gram of casting waste and USD 100 production cost. Final CAD and cast-weight approval are required before Etsy price action.",
    "",
    "Each listing is for one ring in the karat and gold color named in the title.",
  ].join("\n");
  assert.equal(
    stripInternalNotes(before).text,
    [
      "DETAILS",
      "• Thickness: approximately 1.5 mm",
      "• No engraving or text personalization",
      "",
      "MADE TO ORDER",
      "Your ring is made to order after the ring size is confirmed.",
      "",
      "Each listing is for one ring in the karat and gold color named in the title.",
    ].join("\n"),
  );
});

test("a description without any signal comes back unchanged", () => {
  const d = "A solid 14K band.\r\n\r\n- Made to order.\n\n\nCARE\nWipe it clean.";
  assert.equal(stripInternalNotes(d).text, d);
});

test("visualization and internal rules run together", () => {
  const r = stripPublicDescription(
    "- The necklace is made to order with 1–3 days of processing, and the styled images are production visualizations rather than a final product gallery.",
  );
  assert.equal(r.text, "- The necklace is made to order with 1–3 days of processing.");
});

test("image alt text loses the visualization note and keeps the gallery marker", () => {
  const t = "14K Gold Blue Enamel Ring, Blue Notch";
  assert.equal(
    cleanAltText("Blue Notch: hero on travertine. AI design visualization, 2048 square upscale. [artifact-2027/R01/01 0a1b2c3d4e5f]", t),
    "Blue Notch: hero on travertine. [artifact-2027/R01/01 0a1b2c3d4e5f]",
  );
  assert.equal(
    cleanAltText("Blue Notch: AI home studio design visualization. [artifact-2027/R01/home 0a1b2c3d4e5f]", t),
    "Blue Notch: home studio view. [artifact-2027/R01/home 0a1b2c3d4e5f]",
  );
  // Only a label would be left: the listing title takes its place.
  assert.equal(cleanAltText("Blue Notch: AI-assisted visualization.", t), t);
  // Ordinary alt text is untouched.
  const plain = "Lintel Ring, sales photo 3 of 10. [ss27-anklets/A24/03 0a1b2c3d4e5f]";
  assert.equal(cleanAltText(plain, t), plain);
});

test("whitespace alone is never a problem: clean text with CRLF, a trailing newline or a blank run passes as it is", () => {
  for (const d of ["A solid 14K band.\nMade to order.\n", "A solid 14K band.\r\nMade to order.", "A band.\n\n\nCARE\nWipe."]) {
    assert.equal(publicTextProblem(d), null, JSON.stringify(d));
    assert.equal(stripPublicDescription(d).text, d);
    assert.doesNotThrow(() => assertPublicText(d, "Açıklama"));
  }
});

test("an ambiguous section ends at its first clean line, so buyer copy written right under it stays", () => {
  assert.equal(
    stripPublicDescription(
      "DETAILS\n• Solid 14K\n\nPRODUCTION NOTE\nExact finished weight and supplier cost are pending production readback.\nJade Gold NYC, designed in New York City.",
    ).text,
    "DETAILS\n• Solid 14K\n\nJade Gold NYC, designed in New York City.",
  );
  assert.equal(
    stripPublicDescription("PRICE NOTE\nWeights are pre-production estimates.\nThis bracelet ships in a gift box.\nFast shipping from the USA.").text,
    "This bracelet ships in a gift box.\nFast shipping from the USA.",
  );
});

test("a section internal by name takes its whole paragraph, whatever its lines say", () => {
  assert.equal(
    stripPublicDescription(
      "A solid 14K band.\n\nINTERNAL NOTES\nMaker: Görkem. Quote 2 g + 100 USD enamel; chain 150 to 170 USD.\nRe-check the bail opening on the sample.\n\nCARE\nWipe with a soft cloth.",
    ).text,
    "A solid 14K band.\n\nCARE\nWipe with a soft cloth.",
  );
  assert.equal(
    stripPublicDescription(
      "A band.\n\nWEIGHT AND PRICE NOTE\nEvery price includes one additional gram of gold and USD 100 labor.\nFinal CAD and cast-weight approval are required before Etsy price action.\n\nCARE\nWipe.",
    ).text,
    "A band.\n\nCARE\nWipe.",
  );
  assert.equal(stripPublicDescription("SIZE AND SPECIFICATION STATUS\nGram weight and closure come later.\n\nCARE\nWipe.").text, "CARE\nWipe.");
  // An all-caps label or bullet under it is part of the note, not a new section.
  for (const d of [
    "INTERNAL NOTES\nSKU: BAS-27-MINE-R01-14Y\nMaker: Görkem. Quote 2 g + 100 USD enamel; chain 150 to 170 USD.\n\nCARE\nWipe.",
    "WEIGHT AND PRICE NOTE\nWEIGHTS: 10K 2.9 G / 14K 3.2 G / 18K 3.8 G\nGörkem quoted 2 g + 100 USD; chain 150 to 170 USD.\n\nCARE\nWipe.",
  ]) {
    assert.equal(stripPublicDescription(d).text, "CARE\nWipe.", d);
  }
  assert.equal(
    stripPublicDescription("IMPORTANT PRODUCTION NOTE\n• HALLMARK: TBD\nExact weight comes after the maker weighs the casting.\n\nJade Gold NYC.").text,
    "Jade Gold NYC.",
  );
  // A real heading right under it still ends it.
  assert.equal(stripPublicDescription("INTERNAL NOTES\nMaker: Görkem.\nCARE\nWipe.").text, "CARE\nWipe.");
});

test("the result is a fixed point: a second pass and the guard find nothing", () => {
  const d =
    "Exact finished weight, hallmark, closure mechanics and supplier cost are pending production readback. • Proposed solid 14K or 18K gold construction, never plated or filled - The pierced pine design pairs a botanical reference with simple geometric lines.";
  const r = stripPublicDescription(d);
  assert.equal(r.text, "• Solid 14K or 18K gold construction, never plated or filled - The pierced pine design pairs a botanical reference with simple geometric lines.");
  assert.equal(publicTextProblem(r.text), null);
});

test("an emptied heading goes when only the footer follows, and when the image rule emptied it", () => {
  assert.equal(
    stripPublicDescription(
      "VARIATIONS\nChoose 14K or 18K gold.\n\nPERSONALIZATION\nPersonalization is planned, but the submission format and production readback must be owner-approved before Etsy publication.\n\nJade Gold NYC, designed in New York City.",
    ).text,
    "VARIATIONS\nChoose 14K or 18K gold.\n\nJade Gold NYC, designed in New York City.",
  );
  assert.equal(
    stripPublicDescription("ABOUT THIS MODEL PREVIEW\nThe images are design visualizations of the finished piece.\n\nCARE\nWipe clean.").text,
    "CARE\nWipe clean.",
  );
  // The section keeps its heading while a paragraph of its own is left before the next section.
  assert.equal(
    stripPublicDescription("SIZING\nFinal sizes will be confirmed before this design is offered for sale.\n\nOur rings run true to size.\n\nCARE\nWipe.").text,
    "SIZING\n\nOur rings run true to size.\n\nCARE\nWipe.",
  );
});

test("all-caps spec bullets and labels are not headings", () => {
  assert.equal(
    stripPublicDescription("DETAILS\n• 14K GOLD\n• US 7\n• Final ring size will be confirmed before this design is offered for sale.").text,
    "DETAILS\n• 14K GOLD\n• US 7",
  );
  assert.equal(stripPublicDescription("SIZE: US 7\nFinal ring sizes will be confirmed before this design is offered for sale.").text, "SIZE: US 7");
});

test("lines holding only spaces do not leave a double gap", () => {
  assert.equal(stripPublicDescription("A band.\n   \nFinal details will be confirmed before sale.\n   \nCARE\nWipe.").text, "A band.\n\nCARE\nWipe.");
});

test("the owner's example in Spanish goes whole", () => {
  const es =
    "PROPUESTA DE DISEÑO — NO LISTA PARA LA VENTA\nLa única imagen es una visualización de diseño generada por IA, no una fotografía de un producto terminado. Las dimensiones son objetivos de desarrollo. El peso del oro, las opciones finales de talla, la durabilidad, el precio y el plazo de producción requieren una muestra física y la aprobación del fabricante. No se hace ninguna afirmación sobre stock, contraste, alergias o rendimiento.\n\nCUIDADO\nLimpiar con un paño suave.";
  assert.equal(stripPublicDescription(es).text, "CUIDADO\nLimpiar con un paño suave.");
});

test("alt text the rules do not change comes back exactly as it was", () => {
  const t = "14K Gold Blue Enamel Ring, Blue Notch";
  for (const alt of ["Ring  on  hand", "Gold ring\non hand", "14K", "R01", "[AS-01]"]) {
    assert.equal(cleanAltText(alt, t), alt, JSON.stringify(alt));
  }
});

test("an image disclosure is still caught in its other wordings", () => {
  for (const s of ["The images are AI renderings of the ring.", "These photos are renders of the design.", "Gallery images are AI-generated."]) {
    assert.equal(stripPublicDescription(s).text, "", s);
  }
  assert.equal(stripPublicDescription("Shown as a 3D rendering; the handmade ring may vary slightly.").text, "The handmade ring may vary slightly.");
  assert.equal(stripPublicDescription("Ready to ship! Shown as a 3D rendering.").text, "Ready to ship!");
  // The bullet of the kept clause stays.
  assert.equal(stripPublicDescription("✔ Shown as a 3D rendering; ready to ship in 3 days.").text, "✔ Ready to ship in 3 days.");
  for (const s of [
    "Images and video in this listing were created with AI.",
    "The listing photos are illustrative and were made with AI.",
    "Product photos, created with AI, show the intended design.",
    "Las fotos y el video se crearon con IA.",
    "Las imágenes, creadas con IA, muestran el diseño.",
    // A negation that does not govern the AI phrase does not save the disclosure.
    "Las fotos no muestran el sello final porque fueron hechas con IA.",
    "Product photos are not to scale since they were created using AI.",
    "✔ Shown as a 3D rendering",
    "The photos are not the real piece but were generated by AI.",
    // Exceptive idioms assert AI.
    "These photos are nothing but AI art.",
    "These product photos are none other than AI concepts.",
  ]) {
    assert.equal(stripPublicDescription(s).text, "", s);
  }
});

test("the guard refuses internal text and passes clean text", () => {
  assert.equal(publicTextProblem("A solid 14K band. Made to order."), null);
  assert.throws(
    () => assertPublicText("Shown as a single ring. Final gold purity will be confirmed before this design is offered for sale.", "Açıklama"),
    /kamuya açık olmaması gereken/,
  );
});
