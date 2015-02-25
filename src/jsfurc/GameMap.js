var _ = require( "underscore" );
var ListenerHost = require( "./ListenerHost" );

module.exports = function( decoder ) {

   var VIEW_WIDTH = 12;
   var VIEW_HEIGHT = 10;

   var _this = this;
   var _events = new ListenerHost( this );
   var _players = {};
   var _camera = { "x": 0, "y": 0 };
   var _decoderListener;

   this.createPlayer = function( uid, name, x, y, frame )
   {
      var player = {
         "uid": uid,
         "name": name,
         "x": x,
         "y": y,
         "frame": frame,
         visible: _this.isPointVisible( x, y )
      };
      _players[uid] = player;
      _events.raise( "onPlayerCreated", player.uid );
   }

   this.removePlayer = function( uid )
   {
      if (uid in _players)
      {
         var player = _players[uid];
         delete _players[uid];
         _events.raise( "onPlayerRemoved", player.uid );
      }
   }

   this.movePlayer = function( uid, x, y, frame )
   {
      if (uid in _players)
      {
         var player = _players[uid];
         player.x = x;
         player.y = y;
         if (!this.isPointVisible( x, y ))
            _this.removePlayer( player.uid );
         else
            _events.raise( "onPlayerMoved", player.uid );
      }
   }

   this.setCamera = function( x, y )
   {
      _camera.x = x;
      _camera.y = y;
      _cull( );
      _events.raise( "onCameraMoved", _camera.x, _camera.y );
   }

   var _cull = function( )
   {
      _.each( _players,
         function( player ) {
         var visible = _this.isPointVisible( player.x, player.y );
         _toggleVisible( player, visible );
      } );
   }

   var _toggleVisible = function( player, visible )
   {
      if (player.visible != visible)
      {
         player.visible = visible;
         if (visible)
            _events.raise( "onPlayerVisible", uid );
         else
            _events.raise( "onPlayerNotVisible", uid );
      }
   }

   this.isPointVisible = function( x, y )
   {
      var minX = _camera.x - Math.ceil( VIEW_WIDTH/2 );
      var minY = _camera.y - Math.ceil( VIEW_HEIGHT/2 );
      var maxX = minX + VIEW_WIDTH;
      var maxY = minY + VIEW_HEIGHT;
      return x >= minX && x < maxX &&
         y >= minY && y < maxY;
   }

   this.destroy = function( )
   {
      decoder.removeListener( _decoderListener );
   }

   this.getCameraPosition = function( )
   {
      return _.extend( _camera, {} );
   }

   this.getPlayerInfoByUID = function( uid )
   {
      if (uid in _players)
         return _.extend( _players[uid], {} );
   }

   this.getPlayerInfoByName = function( name )
   {
      var player =_.find( _players,
            function( player ) { return player.name == name; } );
      if (player)
         return _.extend( _players, {} );
   }

   this.getAllPlayerInfos = function( )
   {
      var players = [];
      for (uid in _players)
         players.push( _this.getPlayerInfoByUID( uid ) );
      return players;
   }

   this.getAllPlayerUIDs = function( )
   {
      return _.keys( _players );
   }

   _decoderListener = new (function( ) {
      this.onCreatePlayer = function( uid, name, x, y, frame )
      {
         _this.createPlayer( uid, name, x, y, frame );
      }

      this.onRemovePlayer = function( uid )
      {
         _this.destroyPlayer( uid );
      }

      this.onMovePlayer = function( uid, x, y )
      {
         _this.movePlayer( uid, x, y, frame );
      }

      this.onSetCamera = function( x, y )
      {
         _this.setCamera( x, y );
      }

      this.onMoveCamera = function( fromX, fromY, toX, toY )
      {
         _this.setCamera( toX, toY );
      }
   } )( );
   decoder.addListener( _decoderListener );

};
