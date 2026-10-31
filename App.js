import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { SafeAreaView, View, Text, TextInput, ScrollView, Pressable, StyleSheet, Alert, Linking, StatusBar, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { fetchLiveCatalog, CATALOG_API_CONFIGURED } from './catalogService';

const BRAND = '#1F4A3A';
const CREAM = '#F4F1E9';
const INK = '#202720';
const MUTED = '#72786F';
const WEB = 'https://www.kringloop20gorinchem.nl';

const PRODUCTS = [
  { id:'p1', name:'Glazen vaas met opliggende ringen', category:'Wonen', price:22.50, note:'Uniek tweedehands item', icon:'🏺', url:WEB+'/webshop/ontdek-en-actueel/nieuw-binnen/overige-artikelen-nieuw-binnen' },
  { id:'p2', name:'Stephen King – Revival', category:'Boeken', price:4.00, note:'Boeken & verhalen', icon:'📚', url:WEB+'/webshop/ontdek-en-actueel/nieuw-binnen/boeken-nieuw-binnen' },
  { id:'p3', name:'Stijlvol beige colbert – maat 40', category:'Mode', price:6.50, note:'Tweede kans, mooie vondst', icon:'🧥', url:WEB+'/webshop/ontdek-en-actueel/nieuw-binnen/mode-en-accessoires-nieuw-binnen' },
  { id:'p4', name:'Handbeschilderde opbergbak', category:'Wonen', price:25.00, note:'Karaktervol en herbruikbaar', icon:'🪵', url:WEB+'/webshop/ontdek-en-actueel/oktober-de-maand-van-de-metamorfose' },
  { id:'p5', name:'Vintage gitaarblad', category:'Muziek', price:4.50, note:'Voor liefhebbers', icon:'🎸', url:WEB+'/webshop/ontdek-en-actueel/nieuw-binnen/boeken-nieuw-binnen' },
  { id:'p6', name:'Keramieken vaas met kristalglazuur', category:'Wonen', price:2.50, note:'Klein item, grote charme', icon:'✨', url:WEB+'/webshop/ontdek-en-actueel/nieuw-binnen/overige-artikelen-nieuw-binnen' },
];

const money = n => new Intl.NumberFormat('nl-NL', { style:'currency', currency:'EUR' }).format(n);

function Button({ title, onPress, secondary=false, small=false }) {
  return <Pressable onPress={onPress} style={[styles.button, secondary && styles.buttonSecondary, small && styles.buttonSmall]}><Text style={[styles.buttonText, secondary && styles.buttonSecondaryText]}>{title}</Text></Pressable>;
}
function ProductCard({ product, favorite, inCart, onFavorite, onAdd, onOpen }) {
  return <View style={styles.productCard}>
    <Pressable onPress={onOpen} style={styles.productArt}>
      {product.imageUrl ? <Image source={{uri:product.imageUrl}} style={styles.productImage} resizeMode="cover" onError={() => {}} /> : <Text style={styles.productEmoji}>{product.icon || '♻️'}</Text>}
      <View style={styles.tag}><Text style={styles.tagText}>{product.source === 'live' ? (product.availability === 'in_stock' ? 'BESCHIKBAAR' : product.availability === 'out_of_stock' ? 'UITVERKOCHT' : 'VOORRAAD CHECKEN') : 'VOORBEELDARTIKEL'}</Text></View>
    </Pressable>
    <View style={styles.productInfo}>
      <Text style={styles.productCategory}>{product.category.toUpperCase()}</Text>
      <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
      <Text style={styles.productPrice}>{money(product.price)}</Text>
      <View style={styles.cardActions}>
        <Pressable onPress={onFavorite} style={styles.heart}><Text style={{fontSize:20,color:BRAND}}>{favorite ? '♥' : '♡'}</Text></Pressable>
        <Button title={inCart ? 'Toegevoegd ✓' : 'In winkelwagen +'} small onPress={onAdd}/>
      </View>
    </View>
  </View>;
}

export default function App() {
  const [tab, setTab] = useState('shop');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Alles');
  const [favorites, setFavorites] = useState([]);
  const [cart, setCart] = useState({});
  const [contactType, setContactType] = useState('Afspraak inleveren');
  const [contactMessage, setContactMessage] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [noticeEnabled, setNoticeEnabled] = useState(false);
  const [products, setProducts] = useState(PRODUCTS.map(p => ({...p, source:'demo'})));
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogMessage, setCatalogMessage] = useState(CATALOG_API_CONFIGURED ? 'Live catalogus wordt geladen…' : 'Voorbeeldcatalogus · live koppeling nog niet ingesteld');
  const [catalogIsLive, setCatalogIsLive] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadCatalog = useCallback(async (manual=false) => {
    if (!CATALOG_API_CONFIGURED) {
      setCatalogMessage('Voorbeeldcatalogus · live koppeling nog niet ingesteld');
      setCatalogIsLive(false);
      return;
    }
    setCatalogLoading(true);
    if (manual) setRefreshing(true);
    try {
      const live = await fetchLiveCatalog();
      if (!live.length) throw new Error('De catalogus bevat geen producten.');
      setProducts(live.map(p => ({...p, source:'live'})));
      setCatalogIsLive(true);
      setCatalogMessage('Actuele gegevens uit de gekoppelde webshop');
    } catch (error) {
      setCatalogIsLive(false);
      setCatalogMessage('Live catalogus tijdelijk niet bereikbaar · controleer de webshop voor actuele prijs en voorraad');
    } finally { setCatalogLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { loadCatalog(); }, [loadCatalog]);

  const categories = useMemo(() => ['Alles', ...new Set(products.map(p => p.category).filter(Boolean))], [products]);
  const filtered = useMemo(() => products.filter(p =>
    (category === 'Alles' || p.category === category) &&
    (p.name.toLowerCase().includes(query.toLowerCase()) || p.category.toLowerCase().includes(query.toLowerCase())) &&
    (tab !== 'favorites' || favorites.includes(p.id))
  ), [products, query, category, tab, favorites]);

  const cartCount = Object.values(cart).reduce((a,b)=>a+b,0);
  const total = products.reduce((sum,p)=>sum+p.price*(cart[p.id]||0),0);
  const add = p => setCart(prev=>({...prev,[p.id]:(prev[p.id]||0)+1}));
  const remove = p => setCart(prev=>{const next={...prev}; if((next[p.id]||0)<=1) delete next[p.id]; else next[p.id]--; return next;});
  const toggleFavorite = id => setFavorites(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id]);
  const openWeb = async (url=WEB) => { try { await Linking.openURL(url); } catch { Alert.alert('Link niet beschikbaar', 'Open www.kringloop20gorinchem.nl in je browser.'); } };

  const Header = () => <View style={styles.header}>
    <View style={styles.brandMark}><Text style={styles.brandMarkText}>2.0</Text></View>
    <View style={{flex:1}}><Text style={styles.brandTitle}>KRINGLOOP <Text style={{color:BRAND}}>2.0</Text></Text><Text style={styles.brandSub}>GORINCHEM · SAMEN DUURZAAM VERDIENEN</Text></View>
    <Pressable onPress={()=>setTab('cart')} style={styles.cartButton}><Text style={{fontSize:20}}>🛍️</Text>{cartCount>0&&<View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{cartCount}</Text></View>}</Pressable>
  </View>;

  const Nav = () => <View style={styles.nav}>
    {[['shop','Ontdek','⌂'],['favorites','Favorieten','♡'],['cart','Mandje','🛍'],['account','Account','○'],['info','Info','i']].map(([id,label,icon])=>
      <Pressable key={id} onPress={()=>setTab(id)} style={styles.navItem}>
        <Text style={[styles.navIcon,tab===id&&styles.navActive]}>{icon}</Text>
        <Text style={[styles.navLabel,tab===id&&styles.navActive]}>{label}</Text>
        {tab===id&&<View style={styles.navDot}/>}
      </Pressable>)}
  </View>;

  const renderShop = () => <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>loadCatalog(true)} tintColor={BRAND}/> }>
    <View style={styles.hero}>
      <Text style={styles.eyebrow}>VINTAGE · VERRASSEND · VERANTWOORD</Text>
      <Text style={styles.heroTitle}>Een tweede leven.{'\n'}Een nieuwe vondst.</Text>
      <Text style={styles.heroText}>Bijzondere spullen, eerlijke prijzen en samen minder verspillen.</Text>
      <Button title="Bekijk de volledige webshop ↗" onPress={()=>openWeb(WEB+'/webshop')}/>
      <Text style={styles.heroFoot}>UNIEKE ITEMS · OP = OP</Text>
    </View>
    <View style={styles.sectionHeading}><View><Text style={styles.sectionKicker}>MET ZORG GESELECTEERD</Text><Text style={styles.sectionTitle}>{tab==='favorites'?'Jouw favorieten':'Ontdek de vondsten'}</Text></View><Text style={styles.resultCount}>{filtered.length} items</Text></View>
    <View style={styles.catalogStatus}><View style={[styles.statusDot,{backgroundColor:catalogIsLive?'#2F8A58':'#C58A3B'}]}/><View style={{flex:1}}><Text style={styles.catalogStatusText}>{catalogMessage}</Text>{catalogLoading&&<Text style={styles.bodyText}>Producten ophalen…</Text>}</View><Pressable onPress={()=>loadCatalog(true)} accessibilityRole="button"><Text style={styles.refreshText}>↻</Text></Pressable></View>
    <TextInput value={query} onChangeText={setQuery} placeholder="Zoek een product of categorie..." placeholderTextColor="#92978F" style={styles.search}/>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:8, paddingVertical:12}}>
      {categories.map(c=><Pressable key={c} onPress={()=>setCategory(c)} style={[styles.chip,category===c&&styles.chipActive]}><Text style={[styles.chipText,category===c&&styles.chipTextActive]}>{c}</Text></Pressable>)}
    </ScrollView>
    <View style={styles.productGrid}>
      {filtered.map(p=><ProductCard key={p.id} product={p} favorite={favorites.includes(p.id)} inCart={!!cart[p.id]} onFavorite={()=>toggleFavorite(p.id)} onAdd={()=>add(p)} onOpen={()=>openWeb(p.url)}/>)}
    </View>
    {filtered.length===0&&<View style={styles.empty}><Text style={styles.emptyTitle}>Nog geen vondsten</Text><Text style={styles.bodyText}>Pas je zoekopdracht of filter aan.</Text></View>}
    <View style={styles.noteBox}><Text style={styles.noteIcon}>♻</Text><View style={{flex:1}}><Text style={styles.noteTitle}>Elke vondst maakt verschil</Text><Text style={styles.bodyText}>Tweedehands shoppen geeft spullen een nieuw leven en helpt verspilling te verminderen.</Text></View></View>
    <Text style={styles.disclaimer}>Prototypecatalogus met voorbeelditems. Bekijk de website voor actuele voorraad en prijzen.</Text>
  </ScrollView>;

  const renderCart = () => <ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.sectionKicker}>JOUW SELECTIE</Text><Text style={styles.pageTitle}>Winkelwagen</Text>
    {cartCount===0?<View style={styles.empty}><Text style={{fontSize:38}}>🛍️</Text><Text style={styles.emptyTitle}>Je mandje is nog leeg</Text><Text style={styles.bodyText}>Ontdek unieke tweedehands vondsten.</Text><Button title="Verder winkelen" onPress={()=>setTab('shop')}/></View>:
    <>
      {products.filter(p=>cart[p.id]).map(p=><View key={p.id} style={styles.cartRow}><Text style={styles.cartEmoji}>{p.icon}</Text><View style={{flex:1}}><Text style={styles.productName}>{p.name}</Text><Text style={styles.productPrice}>{money(p.price)} · aantal {cart[p.id]}</Text><View style={styles.qtyRow}><Pressable onPress={()=>remove(p)} style={styles.qtyButton}><Text>−</Text></Pressable><Text>{cart[p.id]}</Text><Pressable onPress={()=>add(p)} style={styles.qtyButton}><Text>+</Text></Pressable></View></View><Text style={styles.productPrice}>{money(p.price*cart[p.id])}</Text></View>)}
      <View style={styles.totalRow}><Text style={styles.totalLabel}>Subtotaal (indicatief)</Text><Text style={styles.totalPrice}>{money(total)}</Text></View>
      <Text style={styles.bodyText}>Verzend- of ophaalkosten worden door de webshop bepaald.</Text>
      <Button title="Verder naar veilig afrekenen ↗" onPress={()=>openWeb(WEB+'/webshop')}/>
      <Text style={styles.disclaimer}>Afrekenen gebeurt momenteel op de bestaande website. Deze prototypewagen plaatst geen echte bestelling.</Text>
    </>}
  </ScrollView>;

  const renderAccount = () => <ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.sectionKicker}>JOUW KRINGLOOP 2.0</Text><Text style={styles.pageTitle}>Mijn account</Text>
    <View style={styles.accountHero}><Text style={{fontSize:28}}>✦</Text><Text style={styles.accountHeroTitle}>Shoptegoed sparen</Text><Text style={styles.accountHeroText}>Geregistreerde kopers kunnen volgens de website 5% shoptegoed verdienen bij aankopen.</Text><Text style={styles.creditValue}>€ —</Text><Text style={styles.creditCaption}>Echt saldo wordt pas getoond na koppeling met je account.</Text></View>
    <Text style={styles.fieldLabel}>E-mailadres</Text><TextInput value={profileEmail} onChangeText={setProfileEmail} autoCapitalize="none" keyboardType="email-address" placeholder="jij@voorbeeld.nl" style={styles.input}/>
    <Button title="Inloggen / account aanmaken op website ↗" onPress={()=>openWeb(WEB)}/>
    <View style={styles.settingRow}><View style={{flex:1}}><Text style={styles.productName}>Meldingen over nieuwe artikelen</Text><Text style={styles.bodyText}>Prototypevoorkeur; pushmeldingen zijn nog niet aangesloten.</Text></View><Pressable onPress={()=>setNoticeEnabled(!noticeEnabled)} style={[styles.toggle,noticeEnabled&&styles.toggleOn]}><View style={[styles.toggleKnob,noticeEnabled&&styles.toggleKnobOn]}/></Pressable></View>
    <Text style={styles.disclaimer}>Vul hier geen wachtwoord of betaalgegevens in. Veilig inloggen moet via de officiële webshop lopen.</Text>
  </ScrollView>;

  const renderInfo = () => <ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.sectionKicker}>SAMEN DUURZAAM VERDIENEN</Text><Text style={styles.pageTitle}>Contact & inbreng</Text>
    <View style={styles.infoCard}><Text style={styles.infoTitle}>Spullen een tweede leven geven?</Text><Text style={styles.bodyText}>Artikelen worden in overleg en op afspraak aangeboden. De website vraagt om schone, hele, complete en direct verkoopbare spullen.</Text><Button title="Lees de inbrenginformatie ↗" secondary onPress={()=>openWeb(WEB+'/over-kringloop-2-0-gorinchem/werkwijze/inleveren')}/></View>
    <Text style={styles.fieldLabel}>Waar gaat je bericht over?</Text>
    <View style={styles.choiceWrap}>{['Afspraak inleveren','Bel mij terug','Vraag over een product','Anders'].map(x=><Pressable key={x} onPress={()=>setContactType(x)} style={[styles.chip,contactType===x&&styles.chipActive]}><Text style={[styles.chipText,contactType===x&&styles.chipTextActive]}>{x}</Text></Pressable>)}</View>
    <Text style={styles.fieldLabel}>E-mailadres</Text><TextInput value={contactEmail} onChangeText={setContactEmail} keyboardType="email-address" autoCapitalize="none" placeholder="jij@voorbeeld.nl" style={styles.input}/>
    <Text style={styles.fieldLabel}>Bericht</Text><TextInput value={contactMessage} onChangeText={setContactMessage} placeholder="Waar kunnen we je mee helpen?" multiline style={[styles.input,{height:110,textAlignVertical:'top'}]}/>
    <Button title="Verder naar officieel contactformulier ↗" onPress={()=>openWeb(WEB+'/contact')}/>
    <Text style={styles.disclaimer}>Dit formulier verstuurt nog niets. Je kunt het bericht kopiëren of invullen op het officiële contactformulier.</Text>
    <View style={styles.infoCard}><Text style={styles.infoTitle}>Kringloop 2.0 Gorinchem</Text><Text style={styles.bodyText}>Valkeniersweg 105, 4205 ZC Gorinchem</Text><Text style={styles.bodyText}>KvK 92073867</Text><Button title="Open website ↗" secondary onPress={()=>openWeb(WEB)}/></View>
  </ScrollView>;

  return <SafeAreaView style={styles.safe}>
    <StatusBar barStyle="dark-content" backgroundColor={CREAM}/>
    <Header/>
    <View style={styles.main}>
      {tab==='shop'||tab==='favorites'?renderShop():tab==='cart'?renderCart():tab==='account'?renderAccount():renderInfo()}
    </View>
    <Nav/>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:CREAM},
  header:{paddingHorizontal:18,paddingTop:8,paddingBottom:12,flexDirection:'row',alignItems:'center',gap:10,borderBottomWidth:1,borderBottomColor:'#E3E0D7'},
  brandMark:{width:43,height:43,borderRadius:14,backgroundColor:BRAND,alignItems:'center',justifyContent:'center'},
  brandMarkText:{color:'#FFF',fontSize:15,fontWeight:'900',letterSpacing:-1},
  brandTitle:{fontSize:16,fontWeight:'900',letterSpacing:1.3,color:INK},
  brandSub:{fontSize:8,letterSpacing:1.1,color:MUTED,marginTop:3},
  cartButton:{width:42,height:42,backgroundColor:'#E8E9DF',borderRadius:14,alignItems:'center',justifyContent:'center'},
  cartBadge:{position:'absolute',top:-4,right:-4,backgroundColor:'#C26D45',minWidth:18,height:18,borderRadius:9,alignItems:'center',justifyContent:'center'},
  cartBadgeText:{color:'#FFF',fontSize:10,fontWeight:'800'},
  main:{flex:1},
  content:{padding:18,paddingBottom:30},
  hero:{backgroundColor:BRAND,borderRadius:24,padding:22,marginBottom:26,overflow:'hidden'},
  eyebrow:{fontSize:9,letterSpacing:1.4,color:'#D7E4D6',fontWeight:'800',marginBottom:15},
  heroTitle:{fontSize:32,lineHeight:36,fontWeight:'800',color:'#FFF',letterSpacing:-1,marginBottom:12},
  heroText:{fontSize:14,lineHeight:21,color:'#E5EDE4',marginBottom:20,maxWidth:290},
  button:{backgroundColor:BRAND,paddingHorizontal:16,paddingVertical:14,borderRadius:13,alignItems:'center',justifyContent:'center',marginTop:10},
  buttonText:{color:'#FFF',fontWeight:'800',fontSize:13},
  buttonSecondary:{backgroundColor:'#E7E9DF',borderWidth:1,borderColor:'#D6DCCF'},
  buttonSecondaryText:{color:BRAND},
  buttonSmall:{paddingHorizontal:10,paddingVertical:10,marginTop:0,borderRadius:10,flexShrink:1},
  heroFoot:{fontSize:9,letterSpacing:1.8,color:'#B8CEB8',fontWeight:'800',marginTop:18},
  sectionHeading:{flexDirection:'row',alignItems:'flex-end',justifyContent:'space-between',marginBottom:12},
  sectionKicker:{fontSize:9,letterSpacing:1.5,fontWeight:'800',color:'#8B8E7C',marginBottom:6},
  sectionTitle:{fontSize:24,fontWeight:'800',letterSpacing:-.6,color:INK},
  resultCount:{fontSize:11,color:MUTED,marginBottom:4},
  search:{height:48,backgroundColor:'#FFF',borderRadius:14,borderWidth:1,borderColor:'#E7E4DA',paddingHorizontal:15,fontSize:14,color:INK},
  chip:{borderWidth:1,borderColor:'#DADDD2',borderRadius:30,paddingHorizontal:15,paddingVertical:9,backgroundColor:'#FBFAF6'},
  chipActive:{backgroundColor:BRAND,borderColor:BRAND},
  chipText:{fontSize:12,fontWeight:'700',color:'#62695F'},
  chipTextActive:{color:'#FFF'},
  productGrid:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',rowGap:14},
  productCard:{width:'48.2%',backgroundColor:'#FFF',borderRadius:18,overflow:'hidden',borderWidth:1,borderColor:'#E9E5DB'},
  productArt:{height:135,backgroundColor:'#E9E7DD',alignItems:'center',justifyContent:'center',position:'relative'},
  productImage:{width:'100%',height:'100%'},
  catalogStatus:{flexDirection:'row',alignItems:'center',gap:9,padding:11,borderRadius:12,backgroundColor:'#FFF',borderWidth:1,borderColor:'#E7E4DA',marginBottom:10},
  statusDot:{width:8,height:8,borderRadius:4},
  catalogStatusText:{fontSize:11,lineHeight:16,color:INK,fontWeight:'700'},
  refreshText:{fontSize:22,color:BRAND,fontWeight:'800',paddingHorizontal:6},
  productEmoji:{fontSize:48},
  tag:{position:'absolute',left:9,bottom:9,backgroundColor:'#F8F5EB',paddingHorizontal:8,paddingVertical:5,borderRadius:5},
  tagText:{fontSize:7,fontWeight:'900',letterSpacing:1,color:BRAND},
  productInfo:{padding:11},
  productCategory:{fontSize:8,letterSpacing:1.2,color:'#8B8E7C',fontWeight:'900',marginBottom:5},
  productName:{fontSize:13,fontWeight:'800',lineHeight:18,color:INK},
  productPrice:{fontSize:15,fontWeight:'900',color:BRAND,marginTop:7},
  cardActions:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:5,marginTop:11},
  heart:{width:34,height:36,borderRadius:10,backgroundColor:'#F2F2EB',alignItems:'center',justifyContent:'center'},
  noteBox:{marginTop:22,backgroundColor:'#E5E9DE',borderRadius:18,padding:16,flexDirection:'row',gap:12,alignItems:'flex-start'},
  noteIcon:{fontSize:26,color:BRAND},
  noteTitle:{fontSize:14,fontWeight:'800',color:INK,marginBottom:4},
  bodyText:{fontSize:12,lineHeight:18,color:MUTED,marginTop:5},
  disclaimer:{fontSize:10,lineHeight:15,color:'#8A8D83',marginTop:15},
  nav:{flexDirection:'row',backgroundColor:'#FFF',borderTopWidth:1,borderTopColor:'#E6E3D9',paddingTop:9,paddingBottom:7,paddingHorizontal:5},
  navItem:{flex:1,alignItems:'center',gap:2,position:'relative'},
  navIcon:{fontSize:20,color:'#9A9E94',height:24},
  navLabel:{fontSize:9,color:'#8C9087',fontWeight:'700'},
  navActive:{color:BRAND,fontWeight:'900'},
  navDot:{width:4,height:4,borderRadius:2,backgroundColor:BRAND,marginTop:2},
  pageTitle:{fontSize:30,fontWeight:'900',letterSpacing:-.8,color:INK,marginBottom:22},
  empty:{alignItems:'center',paddingVertical:45,gap:10},
  emptyTitle:{fontSize:18,fontWeight:'800',color:INK,marginTop:5},
  cartRow:{flexDirection:'row',gap:12,alignItems:'flex-start',paddingVertical:15,borderBottomWidth:1,borderBottomColor:'#E1DED4'},
  cartEmoji:{width:58,height:58,borderRadius:15,backgroundColor:'#E7E6DC',alignItems:'center',textAlign:'center',textAlignVertical:'center',fontSize:28,paddingTop:12},
  qtyRow:{flexDirection:'row',alignItems:'center',gap:12,marginTop:8},
  qtyButton:{width:27,height:27,borderRadius:8,backgroundColor:'#E7E9DF',alignItems:'center',justifyContent:'center'},
  totalRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:22},
  totalLabel:{fontSize:14,fontWeight:'800',color:INK},
  totalPrice:{fontSize:23,fontWeight:'900',color:BRAND},
  accountHero:{backgroundColor:BRAND,borderRadius:22,padding:20,alignItems:'flex-start',marginBottom:22},
  accountHeroTitle:{fontSize:22,fontWeight:'900',color:'#FFF',marginTop:10},
  accountHeroText:{fontSize:13,lineHeight:19,color:'#E1E9DF',marginTop:6},
  creditValue:{fontSize:34,fontWeight:'900',color:'#FFF',marginTop:20},
  creditCaption:{fontSize:10,color:'#C8D9C7',marginTop:2},
  fieldLabel:{fontSize:12,fontWeight:'800',color:INK,marginTop:15,marginBottom:7},
  input:{backgroundColor:'#FFF',borderWidth:1,borderColor:'#E2DFD5',borderRadius:13,paddingHorizontal:14,paddingVertical:13,fontSize:14,color:INK},
  settingRow:{flexDirection:'row',alignItems:'center',gap:12,backgroundColor:'#FFF',borderRadius:16,padding:14,marginTop:24},
  toggle:{width:48,height:28,borderRadius:14,backgroundColor:'#D7D9D0',padding:3,justifyContent:'center'},
  toggleOn:{backgroundColor:BRAND},
  toggleKnob:{width:22,height:22,borderRadius:11,backgroundColor:'#FFF'},
  toggleKnobOn:{alignSelf:'flex-end'},
  infoCard:{backgroundColor:'#FFF',borderRadius:18,padding:17,marginBottom:16,borderWidth:1,borderColor:'#E8E4DA'},
  infoTitle:{fontSize:17,fontWeight:'900',color:INK,marginBottom:5},
  choiceWrap:{flexDirection:'row',flexWrap:'wrap',gap:8},
});
