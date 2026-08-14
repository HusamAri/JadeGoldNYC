-- 0142 — EON 13 çekirdek listing: EN başlık revizyonu + ES çeviri katmanı (DRAFT).
-- ---------------------------------------------------------------------------
-- Kaynak: workflow wf_06814946-01e (üretici → adversarial denetçi → akıcılık),
-- 2026-08-14. Metinlerin insan okunur hâli docs/eon/seo/es/ altında yaşıyor;
-- bu migration onların DB karşılığıdır (akış durumu + push kapısı).
--
-- status='draft': bu satırlar Etsy'ye GİDEMEZ. app/api/ops/es-push/route.ts
-- yalnız status='approved' satırları okur. Onay insan tarafından verilir.
-- tags NULL: İngilizce tag revizyonu (listing CSV export) ve İspanyolca tag
-- seti (Alura hacim ölçümü) henüz ölçülmedi; ölçülmeden tag kilitlenmez.
-- product_id elle taşınmaz, etsy_listing_id'den çözülür (transkripsiyon riski yok).
-- Idempotent: on conflict (org_id, product_id, lang) do update.

insert into public.product_translations (org_id, product_id, lang, title, description, tags, status, source)
select p.org_id, p.id, 'en', $eon$10K Rose Gold Milgrain Wedding Band, Personalized Engraved Vintage Ring, Beaded Edge Comfort Fit$eon$, null, null, 'draft', 'workflow'
from public.products p
where p.etsy_listing_id = 4539493533 and p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0'
on conflict (org_id, product_id, lang) do update
  set title = excluded.title, description = excluded.description,
      tags = excluded.tags, status = 'draft', source = 'workflow', note = null;

insert into public.product_translations (org_id, product_id, lang, title, description, tags, status, source)
select p.org_id, p.id, 'es', $eon$Anillo de Boda de Oro Rosa Macizo 10K, Milgrain, Grabado Personalizado Gratis, Interior Redondeado$eon$, $eon$Los anillos viejos se reconocen por el borde.

El milgrain es un trabajo de joyería antigua: una hilera de granos de oro corrida a lo largo de los dos filos del aro. Aquí va en oro rosa macizo de 10K, y el resultado es un tono cálido, rosado, con una línea fina de luz encendida en cada canto cuando la mano se mueve.

Nuestro orfebre lo hace a pedido, en tu talla y en el ancho que elijas. Es una pieza para usar a diario y para quedarse después en la familia. El sello de 10K queda grabado por dentro: no se ve con el anillo puesto, pero siempre se puede comprobar.

- ¿No sabes qué ancho pedir? De 2 a 3 mm se ve bajo y delicado, 4 y 5 mm es el ancho clásico de un anillo de boda, y de 6 mm en adelante se lee más amplio sobre la mano.
- Once anchos, de 2 mm a 12 mm. Lo único que cambia entre uno y otro es cuánto dedo cubre el aro: el grosor es siempre de 1.5 mm.
- Tallas US 4 a 16, enteras y medias.
- Perfil milgrain en oro rosa, con el granulado trabajado en ambos bordes.
- Interior redondeado de ajuste confort, sin canto vivo por dentro.
- Grabado interior de cortesía, hasta 30 caracteres, copiado carácter por carácter: una fecha, iniciales, unas coordenadas o una frase corta. Manuscrita por defecto, imprenta si la pides. Si lo dejas en blanco, el anillo sale liso por dentro.
- Oro macizo de 10K de lado a lado: no es enchapado, no es laminado y no es hueco.

El grabado se reproduce tal cual, así que revisa la ortografía antes de enviarlo. ¿No sabes tu talla? Escríbenos antes de ordenar y te explicamos cómo medirla en casa. Cada anillo se despacha en 1 a 2 días hábiles.

SOBRE EON

EON hace oro macizo personalizado para quienes compran joyería como algo que se conserva y se hereda. Cada pieza la fabrica a pedido nuestro orfebre en oro macizo de 10K o 14K, nunca enchapado y nunca laminado.

PERSONALIZACIÓN

Puedes agregar un grabado privado en el interior de la pieza: una fecha, unas coordenadas, iniciales, un nombre o unas pocas palabras. El grabado es de cortesía. Los estilos de letra y el límite de caracteres se indican en cada publicación.

MATERIAL Y OPCIONES

Cada publicación indica el quilataje, el color del oro, el ancho, el perfil y las tallas disponibles. La disponibilidad de oro amarillo, blanco y rosa varía según el diseño. El oro se cotiza al momento de tu pedido.

HECHO PARA UNA PERSONA

Nada se trata como inventario anónimo. Tu pieza se prepara con la talla, el metal y el grabado que elegiste. Las dudas sobre calce, materiales o personalización se responden antes de empezar la producción.

EON

Sentido hecho para durar. Se usa hoy. Lo llevan las manos que siguen.$eon$, null, 'draft', 'workflow'
from public.products p
where p.etsy_listing_id = 4539493533 and p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0'
on conflict (org_id, product_id, lang) do update
  set title = excluded.title, description = excluded.description,
      tags = excluded.tags, status = 'draft', source = 'workflow', note = null;

insert into public.product_translations (org_id, product_id, lang, title, description, tags, status, source)
select p.org_id, p.id, 'en', $eon$10K Yellow Gold Milgrain Wedding Band, Personalized Engraved Heirloom Ring, Vintage Beaded Edge$eon$, null, null, 'draft', 'workflow'
from public.products p
where p.etsy_listing_id = 4539517211 and p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0'
on conflict (org_id, product_id, lang) do update
  set title = excluded.title, description = excluded.description,
      tags = excluded.tags, status = 'draft', source = 'workflow', note = null;

insert into public.product_translations (org_id, product_id, lang, title, description, tags, status, source)
select p.org_id, p.id, 'es', $eon$Anillo de Boda de Oro Amarillo Macizo 10K, Milgrain, Grabado Personalizado Gratis, Ajuste Confort$eon$, $eon$Una boda, un aniversario, una promesa: la misma pieza sirve para las tres.

Anillo de boda en oro amarillo macizo de 10K con borde milgrain, esa hilera fina de cuentas de oro labrada en los dos filos del aro. El detalle es pequeño y se aprecia de cerca: la luz se corta en una línea de puntos en lugar de correr lisa por el borde.

Se fabrica a pedido en la talla y el ancho que pidas, y lleva el sello 10K en el interior. El color no es superficial, porque el oro es el mismo por dentro y por fuera.

- ¿No sabes qué ancho pedir? De 2 a 3 mm queda bajo y delicado, 4 y 5 mm es el ancho más pedido para un anillo de boda, y de 6 mm en adelante se ve amplio sobre la mano.
- Once anchos, de 2 mm a 12 mm, con el mismo grosor de 1.5 mm en todos.
- Tallas US 4 a 16, enteras y medias, para él y para ella.
- Ajuste confort con interior redondeado: sube el nudillo sin raspar y se asienta plano durante el día.
- Grabado interior sin cargo, hasta 30 caracteres, reproducido letra por letra como lo escribas: una fecha, dos iniciales, unas coordenadas o algo como A y J 15 de junio. La letra manuscrita viene por defecto; indícanos si la quieres en imprenta. Si lo dejas en blanco, el anillo sale liso por dentro.
- Oro macizo de 10K: no es enchapado, no es laminado y no es hueco.

Lo grabamos exactamente como nos lo mandas, así que revisa la ortografía. Y si estás entre dos tallas, escríbenos antes de comprar y te ayudamos a medirla en casa. Cada anillo se despacha en 1 a 2 días hábiles.

SOBRE EON

EON hace oro macizo personalizado para quienes compran joyería como algo que se conserva y se hereda. Cada pieza la fabrica a pedido nuestro orfebre en oro macizo de 10K o 14K, nunca enchapado y nunca laminado.

PERSONALIZACIÓN

Puedes agregar un grabado privado en el interior de la pieza: una fecha, unas coordenadas, iniciales, un nombre o unas pocas palabras. El grabado es de cortesía. Los estilos de letra y el límite de caracteres se indican en cada publicación.

MATERIAL Y OPCIONES

Cada publicación indica el quilataje, el color del oro, el ancho, el perfil y las tallas disponibles. La disponibilidad de oro amarillo, blanco y rosa varía según el diseño. El oro se cotiza al momento de tu pedido.

HECHO PARA UNA PERSONA

Nada se trata como inventario anónimo. Tu pieza se prepara con la talla, el metal y el grabado que elegiste. Las dudas sobre calce, materiales o personalización se responden antes de empezar la producción.

EON

Sentido hecho para durar. Se usa hoy. Lo llevan las manos que siguen.$eon$, null, 'draft', 'workflow'
from public.products p
where p.etsy_listing_id = 4539517211 and p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0'
on conflict (org_id, product_id, lang) do update
  set title = excluded.title, description = excluded.description,
      tags = excluded.tags, status = 'draft', source = 'workflow', note = null;

insert into public.product_translations (org_id, product_id, lang, title, description, tags, status, source)
select p.org_id, p.id, 'en', $eon$10K White Gold Dome Wedding Band, Personalized Engraved Heirloom Ring, Comfort Fit Solid Gold$eon$, null, null, 'draft', 'workflow'
from public.products p
where p.etsy_listing_id = 4539666999 and p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0'
on conflict (org_id, product_id, lang) do update
  set title = excluded.title, description = excluded.description,
      tags = excluded.tags, status = 'draft', source = 'workflow', note = null;

insert into public.product_translations (org_id, product_id, lang, title, description, tags, status, source)
select p.org_id, p.id, 'es', $eon$Anillo de Boda de Oro Macizo 10K Blanco, Abombado, Grabado Personalizado Gratis, Interior Redondeado$eon$, $eon$El oro blanco no levanta la voz. Se queda quieto sobre la piel, frío y claro, y devuelve una sola línea suave de luz cuando la mano se mueve.

Este es un anillo de boda en oro macizo de 10k blanco, abombado por fuera y con ajuste confort por dentro. Nunca bañado, nunca laminado. Se hace por encargo en tu talla, con grabado interior sin costo. La curva de afuera es lo que se ve; el interior redondeado es lo que dejas de sentir al final del día.

- Metal: oro macizo de 10k blanco, nunca bañado y nunca laminado.
- Perfil: abombado, curvo a lo ancho de la cara superior.
- Calce: ajuste confort, con el interior redondeado para que suba el nudillo y se asiente sin presión.
- Anchos: de 2 mm a 12 mm, con 1.5 mm de espesor.
- Tallas: US 4 a la 16, enteras y medias.
- Sello: 10k marcado en el interior del anillo.

Cómo elegir tu medida: la talla va de la 4 a la 16, en enteras y medias, y el ancho se elige aparte en el menú de Ancho, de 2 a 12 mm. Si quedas entre dos tallas, escríbenos antes de hacer tu pedido.

Para personalizarlo: elige tu talla, elige tu ancho y escribe el grabado en la casilla de personalización, hasta 30 caracteres, reproducido tal como lo escribas. Puede ser una fecha, unas iniciales, un nombre o unas coordenadas. La letra manuscrita va por defecto; pide letra de imprenta si la prefieres. Si dejas la casilla vacía, el anillo sale liso. El grabado no tiene costo.

Cortamos y terminamos cada anillo por encargo, en tu talla. Un anillo blanco y sencillo, hecho para usarse todos los días, dormir con él puesto y pasarlo a las manos que siguen.

Peso aproximado por talla US, en oro macizo de 10k (ancho — talla: peso):
- 2 mm — 8: 1.63 g; 14: 2.03 g
- 3 mm — 7.5: 2.4 g; 8.5: 2.5 g; 10: 2.65 g; 12.5: 2.9 g; 15.5: 3.2 g
- 4 mm — 4: 2.74 g; 5: 2.87 g; 5.5: 2.94 g; 8: 3.27 g; 9: 3.4 g; 10.5: 3.6 g; 11.5: 3.74 g; 12: 3.8 g
- 5 mm — 4.5: 3.51 g; 6: 3.75 g; 7: 3.92 g; 11.5: 4.67 g; 12: 4.75 g; 12.5: 4.83 g; 15: 5.29 g
- 6 mm — 4: 4.11 g; 5: 4.3 g; 6: 4.5 g; 8: 4.9 g; 10: 5.3 g; 10.5: 5.4 g; 12.5: 5.8 g
- 7 mm — 4: 4.79 g; 5: 5.02 g; 6: 5.25 g; 6.5: 5.37 g; 8: 5.72 g; 8.5: 5.84 g; 9.5: 6.07 g; 11.5: 6.54 g; 12: 6.65 g; 13.5: 7 g; 15: 7.34 g
- 8 mm — 4: 5.47 g; 4.5: 5.61 g; 5.5: 5.87 g; 7: 6.27 g; 8: 6.54 g; 8.5: 6.67 g; 9: 6.8 g; 9.5: 6.94 g; 10: 7.07 g; 10.5: 7.2 g; 12.5: 7.73 g; 14.5: 8.26 g; 16: 8.66 g
- 9 mm — 4.5: 6.31 g; 5.5: 6.61 g; 7.5: 7.2 g; 9: 7.65 g; 10: 7.95 g; 10.5: 8.1 g; 11: 8.25 g; 12.5: 8.7 g; 13: 8.85 g; 13.5: 8.99 g; 14: 9.14 g; 15.5: 9.59 g; 16: 9.74 g
- 10 mm — 13.5: 9.99 g
- 11 mm — 5: 7.89 g; 6: 8.26 g; 8: 8.99 g; 9.5: 9.54 g; 11: 10.08 g; 12: 10.45 g; 13.5: 11 g; 15: 11.53 g; 15.5: 11.72 g; 16: 11.91 g
- 12 mm — 6.5: 9.21 g; 7.5: 9.61 g; 8.5: 10 g; 10.5: 10.8 g; 14.5: 12.39 g; 15.5: 12.79 g; 16: 12.99 g

Los pesos son aproximados y pueden variar un poco de una pieza a otra.

SOBRE EON

EON hace oro macizo personalizado para quienes compran joyería como algo que se conserva y se hereda. Cada pieza se fabrica por encargo en nuestro taller, en oro macizo de 10k o 14k, nunca bañado y nunca laminado.

PERSONALIZACIÓN

Agrega un grabado privado en el interior de la pieza: una fecha, unas coordenadas, iniciales, un nombre o unas pocas palabras. El grabado no tiene costo. En cada publicación se indican los estilos de letra disponibles y el límite de caracteres.

MATERIAL Y OPCIONES

Cada publicación indica el quilataje, el color del oro, el ancho, el perfil y las tallas disponibles. La disponibilidad de oro amarillo, blanco y rosa cambia según el diseño. El oro se cotiza al momento de tu pedido.

HECHO PARA UNA PERSONA

Aquí nada sale de un inventario anónimo. Tu pieza se prepara con la talla, el metal y el grabado que elegiste. Cualquier duda sobre calce, materiales o personalización la resolvemos antes de empezar a producir.

EON

Un significado hecho para durar. Se usa hoy. Lo llevan las manos que siguen.$eon$, null, 'draft', 'workflow'
from public.products p
where p.etsy_listing_id = 4539666999 and p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0'
on conflict (org_id, product_id, lang) do update
  set title = excluded.title, description = excluded.description,
      tags = excluded.tags, status = 'draft', source = 'workflow', note = null;

insert into public.product_translations (org_id, product_id, lang, title, description, tags, status, source)
select p.org_id, p.id, 'en', $eon$10K Yellow Gold Beveled Edge Wedding Band, Personalized Engraved Ring, Polished Flat Top$eon$, null, null, 'draft', 'workflow'
from public.products p
where p.etsy_listing_id = 4539727911 and p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0'
on conflict (org_id, product_id, lang) do update
  set title = excluded.title, description = excluded.description,
      tags = excluded.tags, status = 'draft', source = 'workflow', note = null;

insert into public.product_translations (org_id, product_id, lang, title, description, tags, status, source)
select p.org_id, p.id, 'es', $eon$Anillo de Boda de Oro Macizo 10K, Borde Biselado, Grabado Personalizado Gratis, Oro Amarillo$eon$, $eon$Hay cosas que terminan durando más que el motivo por el que se entregaron. Este anillo de oro macizo de 10k —amarillo, de cara plana pulida y un bisel nítido a cada lado— es una de ellas.

La cara ancha recoge la luz de forma pareja, mientras el escalón inclinado de cada borde traza una línea firme, casi arquitectónica, alrededor del dedo. Lo trabaja nuestro orfebre y lo hacemos a tu medida, en oro macizo de principio a fin, nunca enchapado ni relleno: el color no vive en una capa exterior, es el mismo oro de lado a lado.

- Oro amarillo macizo de 10k con pulido espejo sobre la cara superior y biseles simétricos a los lados, que le dan al perfil su carácter definido y moderno.
- Once anchos, de 2 mm a 12 mm, ya sea que busques un anillo delgado para apilar o una banda ancha que se sostenga sola.
- Medidas US de la 4 a la 16, enteras y medias, con interior redondeado de ajuste confort para un calce parejo y sin filos.
- Banda de 1.5 mm de espesor, cortada y formada según lo que elijas.
- Grabado interior sin costo de hasta 30 caracteres: una fecha, unas coordenadas, iniciales o una frase corta que quede solo entre tú y el oro. La letra manuscrita viene por defecto; avísanos si prefieres letra de imprenta.
- Hecho por encargo y despachado en 1 o 2 días hábiles. El quilataje va marcado por dentro.

En la foto aparece el anillo en uno de sus anchos mayores: se distingue la cara plana pulida y el escalón limpio donde cada bisel encuentra el borde.

SOBRE EON

EON crea oro macizo personalizado para quienes compran joyería pensando en lo que se hereda. Nuestro orfebre fabrica cada pieza por encargo, en oro macizo de 10k o 14k, nunca enchapado y nunca relleno.

PERSONALIZACIÓN

Agrega un grabado privado en el interior de la pieza: una fecha, unas coordenadas, iniciales, un nombre o unas pocas palabras. El grabado no tiene costo adicional. Los estilos de letra disponibles y el límite de caracteres se indican en cada publicación.

MATERIAL Y OPCIONES

En cada publicación se detallan el quilataje, el color del metal, el ancho, el perfil y las medidas disponibles. La disponibilidad de oro amarillo, blanco y rosado varía según el diseño. El oro se cotiza al momento de tu pedido.

HECHO PARA UNA PERSONA

Aquí nada se trata como mercancía anónima. Tu pieza se prepara con la medida, el metal y el grabado que elegiste. Respondemos cualquier duda sobre el calce, los materiales o la personalización antes de empezar la producción.

EON

Un significado hecho para durar. Se usa hoy. Lo llevan las manos que vienen.$eon$, null, 'draft', 'workflow'
from public.products p
where p.etsy_listing_id = 4539727911 and p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0'
on conflict (org_id, product_id, lang) do update
  set title = excluded.title, description = excluded.description,
      tags = excluded.tags, status = 'draft', source = 'workflow', note = null;

insert into public.product_translations (org_id, product_id, lang, title, description, tags, status, source)
select p.org_id, p.id, 'en', $eon$10K Yellow Gold Dome Wedding Band, Personalized Engraved Heirloom Ring, His and Hers Sizes$eon$, null, null, 'draft', 'workflow'
from public.products p
where p.etsy_listing_id = 4539764153 and p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0'
on conflict (org_id, product_id, lang) do update
  set title = excluded.title, description = excluded.description,
      tags = excluded.tags, status = 'draft', source = 'workflow', note = null;

insert into public.product_translations (org_id, product_id, lang, title, description, tags, status, source)
select p.org_id, p.id, 'es', $eon$Anillo de Boda de Oro Macizo 10K Amarillo, Abombado, Grabado Personalizado Gratis, Ajuste Confort$eon$, $eon$Hay cosas que siguen aquí mucho después del día que marcan. Una argolla de matrimonio en oro macizo de 10k amarillo lleva esa fecha en metal de verdad: sobre la piel, no guardada en una caja ni anotada en un papel.

El perfil abombado es el de siempre, media caña sin aristas, que recoge la luz en un arco tibio en lugar de partirla en planos. Por dentro va redondeado, con ajuste confort, para que entre sin esfuerzo y descanse sin filos. Cada anillo de boda se hace por encargo en nuestro taller, lleva el sello 10k en el interior y se termina en la talla y el ancho que elijas.

- Once anchos, de 2 mm a 12 mm: entre 2 y 4 mm el anillo se ve fino y combina bien apilado; entre 5 y 7 mm está el ancho clásico de una argolla de oro amarillo; de 8 a 12 mm ocupa buena parte del dedo.
- Tallas US 4 a la 16, enteras y medias. El espesor es parejo, 1.5 mm, y cada anillo se corta y se forma según tu medida.
- Perfil abombado de media caña: suaviza la luz en vez de reflejarla en superficies planas.
- Interior redondeado, ajuste confort: entra con facilidad y descansa plano todo el día, sin bordes internos que molesten.
- Grabado interior sin costo, hasta 30 caracteres, copiado tal como lo escribas: una fecha, iniciales, unas coordenadas o una frase corta como "A & J · 15 de junio". La letra manuscrita es la predeterminada; avísanos si la prefieres de imprenta.
- Oro macizo de 10k en toda la pieza, nunca bañado y nunca laminado: oro de verdad, para usarse por décadas y seguir siendo oro por dentro y por fuera.

Si estás entre dos tallas o tienes dudas, escríbenos antes de hacer tu pedido. Cada anillo sale de nuestro taller en 1 a 2 días hábiles.

SOBRE EON

EON hace oro macizo personalizado para quienes compran joyería como algo que se conserva y se hereda. Cada pieza se fabrica por encargo en nuestro taller, en oro macizo de 10k o 14k, nunca bañado y nunca laminado.

PERSONALIZACIÓN

Agrega un grabado privado en el interior de la pieza: una fecha, unas coordenadas, iniciales, un nombre o unas pocas palabras. El grabado no tiene costo. En cada publicación se indican los estilos de letra disponibles y el límite de caracteres.

MATERIAL Y OPCIONES

Cada publicación indica el quilataje, el color del oro, el ancho, el perfil y las tallas disponibles. La disponibilidad de oro amarillo, blanco y rosa cambia según el diseño. El oro se cotiza al momento de tu pedido.

HECHO PARA UNA PERSONA

Aquí nada sale de un inventario anónimo. Tu pieza se prepara con la talla, el metal y el grabado que elegiste. Cualquier duda sobre calce, materiales o personalización la resolvemos antes de empezar a producir.

EON

Un significado hecho para durar. Se usa hoy. Lo llevan las manos que siguen.$eon$, null, 'draft', 'workflow'
from public.products p
where p.etsy_listing_id = 4539764153 and p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0'
on conflict (org_id, product_id, lang) do update
  set title = excluded.title, description = excluded.description,
      tags = excluded.tags, status = 'draft', source = 'workflow', note = null;

insert into public.product_translations (org_id, product_id, lang, title, description, tags, status, source)
select p.org_id, p.id, 'en', $eon$10K Rose Gold Dome Wedding Band, Personalized Engraved Ring, Womens Thin Comfort Fit Band$eon$, null, null, 'draft', 'workflow'
from public.products p
where p.etsy_listing_id = 4539776904 and p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0'
on conflict (org_id, product_id, lang) do update
  set title = excluded.title, description = excluded.description,
      tags = excluded.tags, status = 'draft', source = 'workflow', note = null;

insert into public.product_translations (org_id, product_id, lang, title, description, tags, status, source)
select p.org_id, p.id, 'es', $eon$Anillo de Boda de Oro Macizo 10K Rosa, Abombado, Grabado Personalizado Gratis, Para Ella$eon$, $eon$Una fecha escrita por dentro, donde solo ustedes dos saben que está. Eso es lo que lleva un anillo grabado en oro macizo de 10k rosa: una línea privada de texto dentro de una argolla hecha para durar más que el momento que marca.

El tono rosado es tibio y discreto, nada estridente: un color que se acomoda al uso diario y se hace más tuyo con los años. El perfil abombado, pulido, concentra la luz en un solo arco limpio sobre la curva. Es oro macizo de 10k rosa, nunca bañado y nunca laminado, sellado 10k por dentro y hecho por encargo en tu talla exacta.

- Metal: oro macizo de 10k rosa con acabado pulido y el sello 10k marcado en el interior.
- Perfil abombado e interior de ajuste confort, redondeado para que el anillo pase el nudillo y descanse sin presión todo el día.
- Anchos de 2 mm a 12 mm con un espesor constante de 1.5 mm, elegidos entre once opciones en el menú de Ancho.
- Tallas US 4 a la 16, enteras y medias. Si quedas entre dos tallas, o si eliges un ancho mayor, escríbenos antes de hacer tu pedido: mientras más ancho el anillo, más ajustado se siente.
- Grabado interior sin costo, hasta 30 caracteres, reproducido tal cual lo escribas: una fecha, iniciales, unas coordenadas o una frase breve como "A & J, 15 de junio".
- La letra manuscrita es la predeterminada; pide letra de imprenta en la nota de personalización si la prefieres, o deja la casilla vacía y el anillo sale liso.

Cada anillo de boda se hace por encargo, uno a la vez, y sale de nuestro taller en 1 a 2 días hábiles.

SOBRE EON

EON hace oro macizo personalizado para quienes compran joyería como algo que se conserva y se hereda. Cada pieza se fabrica por encargo en nuestro taller, en oro macizo de 10k o 14k, nunca bañado y nunca laminado.

PERSONALIZACIÓN

Agrega un grabado privado en el interior de la pieza: una fecha, unas coordenadas, iniciales, un nombre o unas pocas palabras. El grabado no tiene costo. En cada publicación se indican los estilos de letra disponibles y el límite de caracteres.

MATERIAL Y OPCIONES

Cada publicación indica el quilataje, el color del oro, el ancho, el perfil y las tallas disponibles. La disponibilidad de oro amarillo, blanco y rosa cambia según el diseño. El oro se cotiza al momento de tu pedido.

HECHO PARA UNA PERSONA

Aquí nada sale de un inventario anónimo. Tu pieza se prepara con la talla, el metal y el grabado que elegiste. Cualquier duda sobre calce, materiales o personalización la resolvemos antes de empezar a producir.

EON

Un significado hecho para durar. Se usa hoy. Lo llevan las manos que siguen.$eon$, null, 'draft', 'workflow'
from public.products p
where p.etsy_listing_id = 4539776904 and p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0'
on conflict (org_id, product_id, lang) do update
  set title = excluded.title, description = excluded.description,
      tags = excluded.tags, status = 'draft', source = 'workflow', note = null;

insert into public.product_translations (org_id, product_id, lang, title, description, tags, status, source)
select p.org_id, p.id, 'en', $eon$10K Yellow Gold Flat Wedding Band, Personalized Engraved Ring, Modern Mens Womens Comfort Fit$eon$, null, null, 'draft', 'workflow'
from public.products p
where p.etsy_listing_id = 4539777986 and p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0'
on conflict (org_id, product_id, lang) do update
  set title = excluded.title, description = excluded.description,
      tags = excluded.tags, status = 'draft', source = 'workflow', note = null;

insert into public.product_translations (org_id, product_id, lang, title, description, tags, status, source)
select p.org_id, p.id, 'es', $eon$Anillo de Boda de Oro Macizo 10K Amarillo, Plano, Grabado Personalizado Gratis, Unisex Moderno$eon$, $eon$Una fecha grabada por dentro y un ancho elegido para una sola mano: este anillo de oro macizo de 10k guarda lo importante sin anunciarlo. Oro amarillo macizo, perfil plano, hecho por encargo en tu medida exacta.

- Oro amarillo macizo de 10k en toda la pieza, nunca enchapado ni relleno, con el sello 10k marcado en el interior.
- Perfil plano de cantos rectos y 1.5 mm de espesor. En la foto se ve con acabado pulido, que recoge la luz a lo largo de toda la cara del anillo.
- Once anchos, de 2 mm a 12 mm: de 2 a 4 mm se ve delgado y se apila con facilidad, de 5 a 7 mm es el clásico anillo de boda liso, y de 8 a 12 mm se asienta ancho sobre el dedo.
- Medidas US de la 4 a la 16, enteras y medias, con interior redondeado de ajuste confort: entra sin esfuerzo y no deja filos por dentro.
- Se hace por encargo lo mismo para él que para ella: un anillo de boda unisex de verdad.
- Grabado interior gratis de hasta 30 caracteres: una fecha, iniciales, coordenadas o una frase breve como "A & J · 15 de junio". Lo copiamos tal como lo escribas en la casilla de Personalización. La letra manuscrita viene por defecto; avísanos si prefieres letra de imprenta. Si lo dejas en blanco, el anillo sale liso.
- El peso cambia según el ancho y la medida: un anillo de 5 mm en medida 7.5, por ejemplo, ronda los 4 g de oro macizo.

Es la clase de anillo de oro amarillo que te pones una vez y del que ya no te acuerdas: se usa a diario, se duerme con él, pasa a las manos que siguen. Lo preparamos por encargo y sale en 1 o 2 días hábiles.

SOBRE EON

EON crea oro macizo personalizado para quienes compran joyería pensando en lo que se hereda. Nuestro orfebre fabrica cada pieza por encargo, en oro macizo de 10k o 14k, nunca enchapado y nunca relleno.

PERSONALIZACIÓN

Agrega un grabado privado en el interior de la pieza: una fecha, unas coordenadas, iniciales, un nombre o unas pocas palabras. El grabado no tiene costo adicional. Los estilos de letra disponibles y el límite de caracteres se indican en cada publicación.

MATERIAL Y OPCIONES

En cada publicación se detallan el quilataje, el color del metal, el ancho, el perfil y las medidas disponibles. La disponibilidad de oro amarillo, blanco y rosado varía según el diseño. El oro se cotiza al momento de tu pedido.

HECHO PARA UNA PERSONA

Aquí nada se trata como mercancía anónima. Tu pieza se prepara con la medida, el metal y el grabado que elegiste. Respondemos cualquier duda sobre el calce, los materiales o la personalización antes de empezar la producción.

EON

Un significado hecho para durar. Se usa hoy. Lo llevan las manos que vienen.$eon$, null, 'draft', 'workflow'
from public.products p
where p.etsy_listing_id = 4539777986 and p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0'
on conflict (org_id, product_id, lang) do update
  set title = excluded.title, description = excluded.description,
      tags = excluded.tags, status = 'draft', source = 'workflow', note = null;

insert into public.product_translations (org_id, product_id, lang, title, description, tags, status, source)
select p.org_id, p.id, 'en', $eon$10K White Gold Flat Wedding Band, Personalized Engraved Ring, His and Hers Comfort Fit$eon$, null, null, 'draft', 'workflow'
from public.products p
where p.etsy_listing_id = 4539780408 and p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0'
on conflict (org_id, product_id, lang) do update
  set title = excluded.title, description = excluded.description,
      tags = excluded.tags, status = 'draft', source = 'workflow', note = null;

insert into public.product_translations (org_id, product_id, lang, title, description, tags, status, source)
select p.org_id, p.id, 'es', $eon$Anillo de Boda de Oro Macizo 10K Blanco, Plano, Grabado Personalizado Gratis, Ajuste Confort$eon$, $eon$El oro blanco no levanta la voz. Por dentro lleva la fecha, el nombre o las palabras que elegiste, y nadie más las lee. Oro blanco macizo de 10k, perfil plano, hecho por encargo en tu medida.

- Oro blanco macizo de 10k, nunca enchapado ni relleno, con el sello 10k marcado en el interior.
- Perfil plano de cantos definidos y 1.5 mm de espesor.
- Once anchos, de 2 mm a 12 mm. De 2 a 4 mm se lleva delgado y se apila con facilidad; de 5 a 7 mm es el término medio de todos los días; de 8 a 12 mm se asienta ancho sobre el dedo. Los anchos grandes calzan más justos: de 6 mm en adelante, si quedas entre dos medidas, escríbenos antes de ordenar.
- Medidas US de la 4 a la 16, enteras y medias, con interior redondeado de ajuste confort, sin filos que molesten en el nudillo.
- Grabado interior gratis de hasta 30 caracteres, en la cara que solo ve quien lo usa: una fecha, iniciales, coordenadas o algo breve como "A & J · 15 de junio". Lo copiamos tal como lo escribas, así que revisa la ortografía. La letra manuscrita viene por defecto; avísanos si prefieres letra de imprenta.
- El peso va de unos 2.7 g (4 mm en medida 4) a más de 12.5 g (12 mm en medida 15): un 5 mm en medida 7 pesa cerca de 3.9 g y un 8 mm en medida 4, unos 5.5 g. Son cifras aproximadas.

Elige tu medida y tu ancho, escribe el grabado en la casilla de Personalización —en blanco, sale liso— y cortamos cada pieza por encargo, lista para salir en 1 o 2 días hábiles.

SOBRE EON

EON crea oro macizo personalizado para quienes compran joyería pensando en lo que se hereda. Nuestro orfebre fabrica cada pieza por encargo, en oro macizo de 10k o 14k, nunca enchapado y nunca relleno.

PERSONALIZACIÓN

Agrega un grabado privado en el interior de la pieza: una fecha, unas coordenadas, iniciales, un nombre o unas pocas palabras. El grabado no tiene costo adicional. Los estilos de letra disponibles y el límite de caracteres se indican en cada publicación.

MATERIAL Y OPCIONES

En cada publicación se detallan el quilataje, el color del metal, el ancho, el perfil y las medidas disponibles. La disponibilidad de oro amarillo, blanco y rosado varía según el diseño. El oro se cotiza al momento de tu pedido.

HECHO PARA UNA PERSONA

Aquí nada se trata como mercancía anónima. Tu pieza se prepara con la medida, el metal y el grabado que elegiste. Respondemos cualquier duda sobre el calce, los materiales o la personalización antes de empezar la producción.

EON

Un significado hecho para durar. Se usa hoy. Lo llevan las manos que vienen.$eon$, null, 'draft', 'workflow'
from public.products p
where p.etsy_listing_id = 4539780408 and p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0'
on conflict (org_id, product_id, lang) do update
  set title = excluded.title, description = excluded.description,
      tags = excluded.tags, status = 'draft', source = 'workflow', note = null;

insert into public.product_translations (org_id, product_id, lang, title, description, tags, status, source)
select p.org_id, p.id, 'en', $eon$14K White Gold Milgrain Wedding Band, Personalized Engraved Heirloom Ring, Vintage Beaded Edge$eon$, null, null, 'draft', 'workflow'
from public.products p
where p.etsy_listing_id = 4542485142 and p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0'
on conflict (org_id, product_id, lang) do update
  set title = excluded.title, description = excluded.description,
      tags = excluded.tags, status = 'draft', source = 'workflow', note = null;

insert into public.product_translations (org_id, product_id, lang, title, description, tags, status, source)
select p.org_id, p.id, 'es', $eon$Anillo de Boda de Oro Blanco Macizo 14K, Milgrain, Grabado Personalizado Gratis, Estilo Vintage$eon$, $eon$La luz no cae igual sobre un borde trabajado a mano.

Este anillo de boda va en oro blanco macizo de 14K con borde milgrain: una hilera de cuentas finísimas de oro labrada a lo largo de los dos filos. En vez de un brillo plano, la luz se quiebra en puntos pequeños cuando la mano se mueve, y el pulgar encuentra el borde perlado sin mirar. El oro blanco tiene un tono frío, plateado, que se ve claro contra la piel.

Cada anillo se fabrica a pedido en la talla y el ancho que elijas, y lleva el sello 14K por dentro.

- ¿No sabes qué ancho pedir? De 2 a 3 mm queda bajo y delicado, 4 y 5 mm es el ancho clásico de un anillo de boda, y de 6 mm en adelante se lee más amplio sobre la mano.
- Once anchos, de 2 mm a 12 mm, todos con el mismo grosor de 1.5 mm.
- Tallas US 4 a 16, enteras y medias.
- Interior redondeado de ajuste confort: pasa el nudillo sin trabarse y no deja canto duro por dentro.
- Grabado interior sin costo, hasta 30 caracteres, copiado tal como lo escribes: una fecha, iniciales, unas coordenadas o una frase corta. Viene en letra manuscrita; pídela en imprenta si la prefieres. Si lo dejas en blanco, el anillo sale liso por dentro.
- Oro macizo de 14K de lado a lado: no es enchapado, no es laminado y no es hueco.

El grabado se reproduce exactamente como lo entregas, así que revisa la ortografía antes de enviarlo. Si no tienes clara tu talla, escríbenos antes de comprar y te explicamos cómo medirla en casa. Cada anillo se despacha en 1 a 2 días hábiles.

SOBRE EON

EON hace oro macizo personalizado para quienes compran joyería como algo que se conserva y se hereda. Cada pieza la fabrica a pedido nuestro orfebre en oro macizo de 10K o 14K, nunca enchapado y nunca laminado.

PERSONALIZACIÓN

Puedes agregar un grabado privado en el interior de la pieza: una fecha, unas coordenadas, iniciales, un nombre o unas pocas palabras. El grabado es de cortesía. Los estilos de letra y el límite de caracteres se indican en cada publicación.

MATERIAL Y OPCIONES

Cada publicación indica el quilataje, el color del oro, el ancho, el perfil y las tallas disponibles. La disponibilidad de oro amarillo, blanco y rosa varía según el diseño. El oro se cotiza al momento de tu pedido.

HECHO PARA UNA PERSONA

Nada se trata como inventario anónimo. Tu pieza se prepara con la talla, el metal y el grabado que elegiste. Las dudas sobre calce, materiales o personalización se responden antes de empezar la producción.

EON

Sentido hecho para durar. Se usa hoy. Lo llevan las manos que siguen.$eon$, null, 'draft', 'workflow'
from public.products p
where p.etsy_listing_id = 4542485142 and p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0'
on conflict (org_id, product_id, lang) do update
  set title = excluded.title, description = excluded.description,
      tags = excluded.tags, status = 'draft', source = 'workflow', note = null;

insert into public.product_translations (org_id, product_id, lang, title, description, tags, status, source)
select p.org_id, p.id, 'en', $eon$10K White Gold Dome Wedding Band, Matte Brushed 4mm Size 9, Personalized Custom Order$eon$, null, null, 'draft', 'workflow'
from public.products p
where p.etsy_listing_id = 4543000739 and p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0'
on conflict (org_id, product_id, lang) do update
  set title = excluded.title, description = excluded.description,
      tags = excluded.tags, status = 'draft', source = 'workflow', note = null;

insert into public.product_translations (org_id, product_id, lang, title, description, tags, status, source)
select p.org_id, p.id, 'es', $eon$Anillo de Boda Abombado Mate 4mm, Talla 9, Oro Macizo 10K Blanco, Por Encargo$eon$, $eon$Un anillo de boda abombado en oro macizo de 10k blanco, hecho por encargo con acabado mate cepillado, distinto al de nuestras piezas de siempre. Ajuste confort, 4 mm de ancho, talla US 9 con 19.0 mm de diámetro interior.

Esta publicación a la medida corresponde a lo que conversamos. Considera el tiempo de preparación indicado antes del envío.

Un significado hecho para durar.$eon$, null, 'draft', 'workflow'
from public.products p
where p.etsy_listing_id = 4543000739 and p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0'
on conflict (org_id, product_id, lang) do update
  set title = excluded.title, description = excluded.description,
      tags = excluded.tags, status = 'draft', source = 'workflow', note = null;

insert into public.product_translations (org_id, product_id, lang, title, description, tags, status, source)
select p.org_id, p.id, 'en', $eon$10K Gold Hammered Wedding Band, Personalized Engraved Mens Ring, Rustic Milgrain Comfort Fit$eon$, null, null, 'draft', 'workflow'
from public.products p
where p.etsy_listing_id = 4543442596 and p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0'
on conflict (org_id, product_id, lang) do update
  set title = excluded.title, description = excluded.description,
      tags = excluded.tags, status = 'draft', source = 'workflow', note = null;

insert into public.product_translations (org_id, product_id, lang, title, description, tags, status, source)
select p.org_id, p.id, 'es', $eon$Anillo de Boda Oro Macizo 10K, Martillado, Borde Perlado, Grabado Personalizado Gratis, para Hombre$eon$, $eon$El martillo golpea una sola vez en cada punto, y esa marca no se repite.

Un anillo de boda en oro macizo 10K amarillo, martillado a mano hasta dejar planos suaves e irregulares que quiebran la luz en muchos puntos pequeños en lugar de un solo brillo. Ningún anillo sale idéntico al anterior, y esa diferencia es intencional. Los bordes llevan milgrain, la hilera de puntos finos que enmarca el diseño. El interior es de ajuste confort, redondeado y sin filo, pensado para un anillo que no se quita.

- Nueve anchos, de 4mm a 12mm: de 4 a 6mm se lleva discreto, de 7 a 9mm queda intermedio y de 10 a 12mm se asienta amplio.
- Tallas US 4 a 16, enteras y medias, con 1.5mm de espesor.
- Cada pieza se forja y se termina a mano, una por una.
- Grabado interior gratis de hasta 30 caracteres, tal cual lo escribas: una fecha, iniciales, coordenadas o una frase corta. Letra manuscrita por defecto; pide letra de imprenta o déjalo en blanco si lo prefieres.
- Oro macizo 10K de lado a lado, nunca enchapado, ni relleno, ni hueco; sello 10k por dentro.

Si estás entre dos tallas, escríbenos antes de hacer tu pedido. Se envía dentro de 1 a 2 días hábiles.

SOBRE EON

EON hace oro macizo personalizado para quien compra joyería pensando en lo que queda. Todo se fabrica por encargo en oro macizo de 10K o 14K, nunca enchapado y nunca relleno.

PERSONALIZACIÓN

El grabado interior no tiene costo. Los estilos de letra y el límite de caracteres se indican en cada publicación.

MATERIAL Y OPCIONES

Cada publicación indica quilataje, color de oro, ancho, perfil y tallas. La disponibilidad de cada color cambia según el diseño, y el oro se cotiza al momento de tu pedido.

HECHO PARA UNA PERSONA

Nada se trata como inventario anónimo. Tu pieza se prepara con la talla, el metal y el grabado que elegiste.

EON

Significado hecho para durar. Se usa hoy. Lo llevan las manos que siguen.$eon$, null, 'draft', 'workflow'
from public.products p
where p.etsy_listing_id = 4543442596 and p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0'
on conflict (org_id, product_id, lang) do update
  set title = excluded.title, description = excluded.description,
      tags = excluded.tags, status = 'draft', source = 'workflow', note = null;

insert into public.product_translations (org_id, product_id, lang, title, description, tags, status, source)
select p.org_id, p.id, 'en', $eon$14K Yellow Gold Milgrain Wedding Band, Vintage Personalized Engraved Ring, Beaded Edge Heirloom$eon$, null, null, 'draft', 'workflow'
from public.products p
where p.etsy_listing_id = 4543953211 and p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0'
on conflict (org_id, product_id, lang) do update
  set title = excluded.title, description = excluded.description,
      tags = excluded.tags, status = 'draft', source = 'workflow', note = null;

insert into public.product_translations (org_id, product_id, lang, title, description, tags, status, source)
select p.org_id, p.id, 'es', $eon$Anillo de Boda de Oro Amarillo Macizo 14K, Milgrain, Grabado Personalizado Gratis, Borde Perlado$eon$, $eon$Un anillo se entrega una sola vez y dura mucho más que el día que marca.

Oro amarillo macizo de 14K con borde milgrain: una fila de granos diminutos de oro a lo largo de cada filo. La luz no se refleja en un plano, se recoge en puntos pequeños mientras la mano se mueve, y el amarillo toma temperatura contra la piel.

Cada pieza se hace a pedido, en tu talla y en el ancho que elijas, y sale sellada 14K por dentro. Está pensada para usarse todos los días, para dormir con ella puesta y para pasar a otras manos cuando llegue el momento.

- ¿No sabes qué ancho pedir? De 2 a 3 mm se lleva bajo y discreto, 4 y 5 mm es el ancho clásico de un anillo de boda, y de 6 mm en adelante cubre más dedo.
- Once anchos, de 2 mm a 12 mm, todos con el mismo grosor de 1.5 mm.
- Tallas US 4 a 16, enteras y medias.
- Borde perlado milgrain en los dos filos: es el trabajo que le da el carácter vintage.
- Ajuste confort: el interior va redondeado, entra sin trabarse y no deja canto duro.
- Grabado interior gratis, hasta 30 caracteres, reproducido tal como lo escribes: una fecha, iniciales, coordenadas o una frase breve. Va en letra manuscrita salvo que pidas imprenta. Si lo dejas en blanco, el anillo sale liso por dentro.
- Oro macizo de principio a fin: no es enchapado, no es laminado y no es hueco.

Copiamos el grabado tal cual, así que revisa la ortografía antes de enviarlo. Si dudas entre dos tallas, escríbenos antes de hacer el pedido. Cada anillo se despacha en 1 a 2 días hábiles.

SOBRE EON

EON hace oro macizo personalizado para quienes compran joyería como algo que se conserva y se hereda. Cada pieza la fabrica a pedido nuestro orfebre en oro macizo de 10K o 14K, nunca enchapado y nunca laminado.

PERSONALIZACIÓN

Puedes agregar un grabado privado en el interior de la pieza: una fecha, unas coordenadas, iniciales, un nombre o unas pocas palabras. El grabado es de cortesía. Los estilos de letra y el límite de caracteres se indican en cada publicación.

MATERIAL Y OPCIONES

Cada publicación indica el quilataje, el color del oro, el ancho, el perfil y las tallas disponibles. La disponibilidad de oro amarillo, blanco y rosa varía según el diseño. El oro se cotiza al momento de tu pedido.

HECHO PARA UNA PERSONA

Nada se trata como inventario anónimo. Tu pieza se prepara con la talla, el metal y el grabado que elegiste. Las dudas sobre calce, materiales o personalización se responden antes de empezar la producción.

EON

Sentido hecho para durar. Se usa hoy. Lo llevan las manos que siguen.$eon$, null, 'draft', 'workflow'
from public.products p
where p.etsy_listing_id = 4543953211 and p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0'
on conflict (org_id, product_id, lang) do update
  set title = excluded.title, description = excluded.description,
      tags = excluded.tags, status = 'draft', source = 'workflow', note = null;

insert into public.product_translations (org_id, product_id, lang, title, description, tags, status, source)
select p.org_id, p.id, 'en', $eon$10K Gold Basketweave Wedding Band, Personalized Engraved Mens Ring, Diamond Cut Chevron$eon$, $eon$A solid 10k gold basketweave wedding band, cut by hand into a woven chevron pattern that changes direction as the light moves. The pattern is diamond cut into a matte ground, so every facet reads bright against a soft, textured field. Polished beveled edges frame the weave and keep the profile clean on the finger.

THE DETAILS
Metal: Solid 10k yellow gold, never plated, never filled.
Pattern: Hand-cut basketweave chevron, diamond cut facets on a matte ground.
Edges: Polished bevel, stepped from the pattern.
Fit: Comfort fit interior, rounded so it clears the knuckle.
Widths: 6mm to 10mm, 1.5mm thick.
Sizes: US sizes 4 through 16, whole and half sizes.
Hallmark: Stamped 10k inside the band.

SIZE & WIDTH
Two dropdowns build your band: Width sets the look (6 to 7mm reads balanced, 8 to 10mm sits wide and bold) and Ring Size covers US 4 through 16 in whole and half sizes. Wider bands wear snugger, so message us if you are between sizes.

ENGRAVING
Free inside engraving up to 30 characters, reproduced exactly as typed: a date, initials, coordinates, or a short phrase. Script is the default font; note block letters in your personalization if you prefer, or leave it blank and the band ships clean.

MADE TO ORDER
Each band is cut and finished one at a time. This is a high-detail pattern, so the cutting alone takes longer than a plain band. Ships within 1-2 business days.$eon$, null, 'draft', 'workflow'
from public.products p
where p.etsy_listing_id = 4548151075 and p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0'
on conflict (org_id, product_id, lang) do update
  set title = excluded.title, description = excluded.description,
      tags = excluded.tags, status = 'draft', source = 'workflow', note = null;

insert into public.product_translations (org_id, product_id, lang, title, description, tags, status, source)
select p.org_id, p.id, 'es', $eon$Anillo de Boda Oro Macizo 10K, Tejido Canasta Facetado, Grabado Personalizado Gratis, para Hombre$eon$, $eon$El tejido cambia de dirección con cada movimiento de la mano.

Un anillo de boda en oro macizo 10K amarillo, con tejido tipo canasta tallado a mano en chevrones. Las facetas se tallan sobre un fondo mate y cada corte se enciende contra esa superficie. Los bordes biselados y pulidos enmarcan el patrón.

- Cinco anchos, de 6mm a 10mm: de 6 a 7mm queda equilibrado, de 8 a 10mm amplio.
- Tallas US 4 a 16, enteras y medias, con 1.5mm de espesor. Los anillos más anchos calzan más ajustados: escríbenos si dudas entre dos.
- Interior de ajuste confort, redondeado, sin filo que raspe el nudillo.
- Grabado interior gratis de hasta 30 caracteres, tal cual lo escribas: una fecha, iniciales, coordenadas o una frase corta. Letra manuscrita por defecto; pide letra de imprenta o déjalo en blanco si lo prefieres.
- Oro macizo 10K, nunca enchapado, ni relleno, ni hueco; sello 10k por dentro.

Cada anillo se talla uno por uno, más despacio que una banda lisa. Se envía dentro de 1 a 2 días hábiles.

SOBRE EON

EON hace oro macizo personalizado para quien compra joyería pensando en lo que queda. Todo se fabrica por encargo en oro macizo de 10K o 14K, nunca enchapado y nunca relleno.

PERSONALIZACIÓN

El grabado interior no tiene costo. Los estilos de letra y el límite de caracteres se indican en cada publicación.

MATERIAL Y OPCIONES

Cada publicación indica quilataje, color de oro, ancho, perfil y tallas. La disponibilidad de cada color cambia según el diseño, y el oro se cotiza al momento de tu pedido.

HECHO PARA UNA PERSONA

Nada se trata como inventario anónimo. Tu pieza se prepara con la talla, el metal y el grabado que elegiste.

EON

Significado hecho para durar. Se usa hoy. Lo llevan las manos que siguen.$eon$, null, 'draft', 'workflow'
from public.products p
where p.etsy_listing_id = 4548151075 and p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0'
on conflict (org_id, product_id, lang) do update
  set title = excluded.title, description = excluded.description,
      tags = excluded.tags, status = 'draft', source = 'workflow', note = null;
